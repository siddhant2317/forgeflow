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

describe('work orders — integration', () => {
  it('create work order, complete all steps, assert status transitions to COMPLETE', async () => {
    const part = await prisma.part.create({
      data: { partNumber: 'WO-INT-001', name: 'Test Part', unit: 'each' },
    });

    const createRes = await server.executeOperation(
      {
        query: `
          mutation CreateWO($input: CreateWorkOrderInput!) {
            createWorkOrder(input: $input) {
              id title status
              steps { id description completed }
            }
          }
        `,
        variables: {
          input: {
            title: 'Integration Test WO',
            partId: part.id,
            steps: ['Step Alpha', 'Step Beta'],
          },
        },
      },
      { contextValue: createContext() },
    );

    expect(createRes.body.kind).toBe('single');
    if (createRes.body.kind !== 'single') return;
    expect(createRes.body.singleResult.errors).toBeUndefined();

    const wo = createRes.body.singleResult.data?.createWorkOrder as {
      id: string;
      status: string;
      steps: { id: string; completed: boolean }[];
    };
    expect(wo.status).toBe('PENDING');
    expect(wo.steps).toHaveLength(2);

    const [step1, step2] = wo.steps;

    const completeStep1 = await server.executeOperation(
      { query: `mutation { completeStep(stepId: "${step1.id}") { id completed } }` },
      { contextValue: createContext() },
    );
    expect(completeStep1.body.kind).toBe('single');
    if (completeStep1.body.kind !== 'single') return;
    expect(completeStep1.body.singleResult.errors).toBeUndefined();

    const afterStep1 = await prisma.workOrder.findUnique({ where: { id: wo.id } });
    expect(afterStep1?.status).toBe('IN_PROGRESS');

    await server.executeOperation(
      { query: `mutation { completeStep(stepId: "${step2.id}") { id completed } }` },
      { contextValue: createContext() },
    );

    const afterStep2 = await prisma.workOrder.findUnique({ where: { id: wo.id } });
    expect(afterStep2?.status).toBe('COMPLETE');
  });
});
