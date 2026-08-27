import { describe, it, expect } from 'vitest';
import { ApolloServer } from '@apollo/server';
import {
  baseTypeDefs,
  partsTypeDefs,
  bomTypeDefs,
  inventoryTypeDefs,
  workOrderTypeDefs,
  dashboardTypeDefs,
} from '../schema/index.js';
import { resolvers } from './index.js';
import { prisma } from '../lib/prisma.js';
import { createContext } from '../lib/context.js';

const server = new ApolloServer({
  typeDefs: [
    baseTypeDefs,
    partsTypeDefs,
    bomTypeDefs,
    inventoryTypeDefs,
    workOrderTypeDefs,
    dashboardTypeDefs,
  ],
  resolvers,
});

beforeAll(() => server.start());
afterAll(async () => {
  await server.stop();
  await prisma.$disconnect();
});

const BOM_TREE_QUERY = /* GraphQL */ `
  query BOMTree($rootPartId: ID!) {
    bomTree(rootPartId: $rootPartId) {
      part { id partNumber name }
      quantity
      children {
        part { id partNumber name }
        quantity
        children {
          part { id partNumber name }
          quantity
          children { part { id } quantity children { part { id } quantity children { part { id } quantity children { part { id } quantity children { part { id } quantity children { part { id } quantity children { } } } } } } }
        }
      }
    }
  }
`;

describe('BOM tree — integration', () => {
  it('returns a 3-level BOM tree correctly', async () => {
    const engine = await prisma.part.create({
      data: { partNumber: 'BOM-ENG-001', name: 'Engine', unit: 'each' },
    });
    const combustion = await prisma.part.create({
      data: { partNumber: 'BOM-CMB-001', name: 'Combustion Chamber', unit: 'each' },
    });
    const injector = await prisma.part.create({
      data: { partNumber: 'BOM-INJ-001', name: 'Injector', unit: 'each' },
    });

    await prisma.bOMRelationship.createMany({
      data: [
        { parentId: engine.id, childId: combustion.id, quantity: 1 },
        { parentId: combustion.id, childId: injector.id, quantity: 6 },
      ],
    });

    const res = await server.executeOperation(
      { query: BOM_TREE_QUERY, variables: { rootPartId: engine.id } },
      { contextValue: createContext() },
    );

    expect(res.body.kind).toBe('single');
    if (res.body.kind !== 'single') return;
    expect(res.body.singleResult.errors).toBeUndefined();

    const tree = res.body.singleResult.data?.bomTree as {
      part: { partNumber: string };
      quantity: number;
      children: {
        part: { partNumber: string };
        quantity: number;
        children: { part: { partNumber: string }; quantity: number }[];
      }[];
    };

    expect(tree.part.partNumber).toBe('BOM-ENG-001');
    expect(tree.children).toHaveLength(1);

    const chamberlevel = tree.children[0];
    expect(chamberlevel.part.partNumber).toBe('BOM-CMB-001');
    expect(chamberlevel.quantity).toBe(1);
    expect(chamberlevel.children).toHaveLength(1);

    const injectorLevel = chamberlevel.children[0];
    expect(injectorLevel.part.partNumber).toBe('BOM-INJ-001');
    expect(injectorLevel.quantity).toBe(6);
  });
});
