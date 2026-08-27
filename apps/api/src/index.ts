import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import depthLimit from 'graphql-depth-limit';
import {
  baseTypeDefs,
  partsTypeDefs,
  bomTypeDefs,
  inventoryTypeDefs,
  workOrderTypeDefs,
  dashboardTypeDefs,
  authTypeDefs,
} from './schema/index.js';
import { resolvers } from './resolvers/index.js';
import { createContext } from './lib/context.js';
import { formatError } from './lib/formatError.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const server = new ApolloServer({
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
  formatError,
  validationRules: [depthLimit(10)],
  introspection: process.env.NODE_ENV !== 'production',
});

await server.start();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
  }),
);
app.use(rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({ method: req.method, path: req.path, status: res.statusCode, ms: Date.now() - start });
  });
  next();
});

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    logger.error({ err }, 'Health check DB ping failed');
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

app.use(
  '/graphql',
  expressMiddleware(server, {
    context: async ({ req }) => createContext(req),
  }) as unknown as express.RequestHandler,
);

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'API server ready');
});
