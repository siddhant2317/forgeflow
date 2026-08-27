import DataLoader from 'dataloader';
import { Context } from '../lib/context.js';
import { requireAuth } from '../lib/requireAuth.js';

interface BOMRelationship {
  id: string;
  parentId: string;
  childId: string;
  quantity: number;
}

export interface BOMNode {
  part: { id: string; partNumber: string; name: string; unit: string };
  quantity: number;
  children: BOMNode[];
}

function createChildrenLoader(ctx: Context) {
  return new DataLoader<string, BOMRelationship[]>(async (parentIds) => {
    const relationships = await ctx.prisma.bOMRelationship.findMany({
      where: { parentId: { in: [...parentIds] } },
    });
    return parentIds.map((pid) => relationships.filter((r) => r.parentId === pid));
  });
}

async function buildTree(
  partId: string,
  quantity: number,
  visited: Set<string>,
  loader: DataLoader<string, BOMRelationship[]>,
  ctx: Context,
): Promise<BOMNode> {
  if (visited.has(partId)) {
    throw new Error(`Circular BOM reference detected at part ${partId}`);
  }
  const nextVisited = new Set(visited);
  nextVisited.add(partId);

  const part = await ctx.prisma.part.findUniqueOrThrow({ where: { id: partId } });
  const childRels = await loader.load(partId);

  const children = await Promise.all(
    childRels.map((rel) => buildTree(rel.childId, rel.quantity, nextVisited, loader, ctx)),
  );

  return { part, quantity, children };
}

export const bomResolvers = {
  Query: {
    bomTree: async (_: unknown, { rootPartId }: { rootPartId: string }, ctx: Context) => {
      const loader = createChildrenLoader(ctx);
      return buildTree(rootPartId, 1, new Set(), loader, ctx);
    },
  },

  Mutation: {
    addBOMRelationship: async (
      _: unknown,
      { parentId, childId, quantity }: { parentId: string; childId: string; quantity: number },
      ctx: Context,
    ) => {
      requireAuth(ctx);
      await ctx.prisma.bOMRelationship.create({ data: { parentId, childId, quantity } });
      const loader = createChildrenLoader(ctx);
      return buildTree(parentId, 1, new Set(), loader, ctx);
    },

    removeBOMRelationship: async (
      _: unknown,
      { parentId, childId }: { parentId: string; childId: string },
      ctx: Context,
    ) => {
      requireAuth(ctx);
      await ctx.prisma.bOMRelationship.deleteMany({ where: { parentId, childId } });
      return true;
    },
  },
};

export { createChildrenLoader, buildTree };
