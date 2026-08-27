import { PrismaClient, User } from '@prisma/client';
import { IncomingMessage } from 'http';
import { prisma } from './prisma.js';
import { verifyToken } from './auth.js';

export interface Context {
  prisma: PrismaClient;
  user: User | null;
}

export async function createContext(req?: IncomingMessage): Promise<Context> {
  let user: User | null = null;

  const authHeader = req?.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const { sub } = verifyToken(token);
      user = await prisma.user.findUnique({ where: { id: sub } });
    } catch {
      // invalid or expired token — user stays null
    }
  }

  return { prisma, user };
}
