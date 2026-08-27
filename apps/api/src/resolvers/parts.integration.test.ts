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

beforeAll(async () => {
  await server.start();
});

afterAll(async () => {
  await server.stop();
  await prisma.$disconnect();
});

describe('parts — integration', () => {
  it('createPart mutation persists and is returned by parts query', async () => {
    const mutationRes = await server.executeOperation(
      {
        query: `
          mutation {
            createPart(input: {
              partNumber: "INT-001"
              name: "Integration Test Part"
              unit: "each"
            }) {
              id
              partNumber
              name
              unit
            }
          }
        `,
      },
      { contextValue: createContext() },
    );

    expect(mutationRes.body.kind).toBe('single');
    if (mutationRes.body.kind !== 'single') return;
    expect(mutationRes.body.singleResult.errors).toBeUndefined();

    const created = mutationRes.body.singleResult.data?.createPart as {
      id: string;
      partNumber: string;
      name: string;
    };
    expect(created.partNumber).toBe('INT-001');
    expect(created.name).toBe('Integration Test Part');

    const queryRes = await server.executeOperation(
      { query: '{ parts { id partNumber name } }' },
      { contextValue: createContext() },
    );

    expect(queryRes.body.kind).toBe('single');
    if (queryRes.body.kind !== 'single') return;
    const parts = queryRes.body.singleResult.data?.parts as { partNumber: string }[];
    expect(parts.some((p) => p.partNumber === 'INT-001')).toBe(true);
  });

  it('updatePart mutation updates the record', async () => {
    const created = await prisma.part.create({
      data: { partNumber: 'INT-002', name: 'Old Name', unit: 'kg' },
    });

    const res = await server.executeOperation(
      {
        query: `
          mutation UpdatePart($id: ID!, $input: UpdatePartInput!) {
            updatePart(id: $id, input: $input) {
              id name unit
            }
          }
        `,
        variables: { id: created.id, input: { name: 'New Name', unit: 'g' } },
      },
      { contextValue: createContext() },
    );

    expect(res.body.kind).toBe('single');
    if (res.body.kind !== 'single') return;
    expect(res.body.singleResult.errors).toBeUndefined();
    const updated = res.body.singleResult.data?.updatePart as { name: string; unit: string };
    expect(updated.name).toBe('New Name');
    expect(updated.unit).toBe('g');
  });

  it('part query returns null for nonexistent id', async () => {
    const res = await server.executeOperation(
      { query: '{ part(id: "does-not-exist") { id } }' },
      { contextValue: createContext() },
    );
    expect(res.body.kind).toBe('single');
    if (res.body.kind !== 'single') return;
    expect(res.body.singleResult.data?.part).toBeNull();
  });
});
