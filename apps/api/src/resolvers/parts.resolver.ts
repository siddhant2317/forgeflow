import { Context } from '../lib/context.js';
import { requireAuth } from '../lib/requireAuth.js';
import { validate, CreatePartSchema, UpdatePartSchema } from '../lib/validation.js';

export const partsResolvers = {
  Part: {
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
    updatedAt: (parent: { updatedAt: Date }) => parent.updatedAt.toISOString(),
  },

  Query: {
    parts: (_: unknown, __: unknown, { prisma }: Context) =>
      prisma.part.findMany({ orderBy: { createdAt: 'desc' } }),

    part: (_: unknown, { id }: { id: string }, { prisma }: Context) =>
      prisma.part.findUnique({ where: { id } }),
  },

  Mutation: {
    createPart: (_: unknown, { input }: { input: unknown }, ctx: Context) => {
      requireAuth(ctx);
      const data = validate(CreatePartSchema, input);
      return ctx.prisma.part.create({ data });
    },

    updatePart: (_: unknown, { id, input }: { id: string; input: unknown }, ctx: Context) => {
      requireAuth(ctx);
      const data = validate(UpdatePartSchema, input);
      return ctx.prisma.part.update({ where: { id }, data });
    },
  },
};
