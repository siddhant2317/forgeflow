import { describe, it, expect } from 'vitest';
import { ApolloServer } from '@apollo/server';
import {
  baseTypeDefs,
  partsTypeDefs,
  bomTypeDefs,
  inventoryTypeDefs,
  workOrderTypeDefs,
  dashboardTypeDefs,
  authTypeDefs,
} from '../schema/index.js';
import { resolvers } from './index.js';

function buildTestServer() {
  return new ApolloServer({
    typeDefs: [
      baseTypeDefs,
      partsTypeDefs,
      bomTypeDefs,
      inventoryTypeDefs,
      workOrderTypeDefs,
      dashboardTypeDefs,
      authTypeDefs,
    ],
    resolvers,
  });
}

describe('health query', () => {
  it('returns "ok"', async () => {
    const server = buildTestServer();
    await server.start();

    const response = await server.executeOperation({ query: '{ health }' });

    expect(response.body.kind).toBe('single');
    if (response.body.kind === 'single') {
      expect(response.body.singleResult.errors).toBeUndefined();
      expect(response.body.singleResult.data).toEqual({ health: 'ok' });
    }

    await server.stop();
  });

  it('schema is valid and server starts without errors', async () => {
    const server = buildTestServer();
    await expect(server.start()).resolves.not.toThrow();
    await server.stop();
  });
});
