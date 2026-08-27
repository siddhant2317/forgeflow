import { Context } from '../lib/context.js';
import { requireAuth } from '../lib/requireAuth.js';
import { validate, AddInventoryItemSchema } from '../lib/validation.js';

export const inventoryResolvers = {
  Query: {
    inventoryItems: (
      _: unknown,
      { partId, location }: { partId?: string; location?: string },
      { prisma }: Context,
    ) =>
      prisma.inventoryItem.findMany({
        where: {
          ...(partId ? { partId } : {}),
          ...(location ? { location } : {}),
        },
        include: { part: true },
        orderBy: { part: { name: 'asc' } },
      }),
  },

  Mutation: {
    addInventoryItem: (
      _: unknown,
      { input }: { input: unknown },
      ctx: Context,
    ) => {
      requireAuth(ctx);
      const data = validate(AddInventoryItemSchema, input);
      return ctx.prisma.inventoryItem.create({ data, include: { part: true } });
    },
  },

  InventoryItem: {
    part: (parent: { partId: string }, _: unknown, { prisma }: Context) =>
      prisma.part.findUniqueOrThrow({ where: { id: parent.partId } }),
  },
};
