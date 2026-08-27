import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildTree, createChildrenLoader } from './bom.resolver.js';
import { prisma } from '../lib/prisma.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    part: { findUniqueOrThrow: vi.fn() },
    bOMRelationship: { findMany: vi.fn() },
  },
}));

const mockPrisma = vi.mocked(prisma);

function ctx() {
  return { prisma: mockPrisma, user: null };
}

const partA = { id: 'A', partNumber: 'P-A', name: 'Part A', unit: 'each' };
const partB = { id: 'B', partNumber: 'P-B', name: 'Part B', unit: 'each' };
const partC = { id: 'C', partNumber: 'P-C', name: 'Part C', unit: 'each' };

beforeEach(() => vi.clearAllMocks());

describe('bomTree — flat (no children)', () => {
  it('returns a leaf node with empty children array', async () => {
    mockPrisma.part.findUniqueOrThrow.mockResolvedValue(partA);
    mockPrisma.bOMRelationship.findMany.mockResolvedValue([]);

    const loader = createChildrenLoader(ctx());
    const tree = await buildTree('A', 1, new Set(), loader, ctx());

    expect(tree.part).toEqual(partA);
    expect(tree.quantity).toBe(1);
    expect(tree.children).toHaveLength(0);
  });
});

describe('bomTree — nested', () => {
  it('builds a two-level tree', async () => {
    mockPrisma.part.findUniqueOrThrow.mockImplementation(({ where }: { where: { id: string } }) => {
      const map: Record<string, typeof partA> = { A: partA, B: partB };
      return Promise.resolve(map[where.id]);
    });

    mockPrisma.bOMRelationship.findMany.mockImplementation(
      ({ where }: { where: { parentId: { in: string[] } } }) => {
        const rels: { id: string; parentId: string; childId: string; quantity: number }[] = [];
        if (where.parentId.in.includes('A')) {
          rels.push({ id: 'rel1', parentId: 'A', childId: 'B', quantity: 2 });
        }
        return Promise.resolve(rels);
      },
    );

    const loader = createChildrenLoader(ctx());
    const tree = await buildTree('A', 1, new Set(), loader, ctx());

    expect(tree.part).toEqual(partA);
    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].part).toEqual(partB);
    expect(tree.children[0].quantity).toBe(2);
    expect(tree.children[0].children).toHaveLength(0);
  });
});

describe('bomTree — circular reference guard', () => {
  it('throws when a circular reference is detected', async () => {
    mockPrisma.part.findUniqueOrThrow.mockImplementation(({ where }: { where: { id: string } }) => {
      const map: Record<string, typeof partA> = { A: partA, B: partB, C: partC };
      return Promise.resolve(map[where.id]);
    });

    mockPrisma.bOMRelationship.findMany.mockImplementation(
      ({ where }: { where: { parentId: { in: string[] } } }) => {
        const rels: { id: string; parentId: string; childId: string; quantity: number }[] = [];
        const ids = where.parentId.in;
        if (ids.includes('A')) rels.push({ id: 'r1', parentId: 'A', childId: 'B', quantity: 1 });
        if (ids.includes('B')) rels.push({ id: 'r2', parentId: 'B', childId: 'A', quantity: 1 });
        return Promise.resolve(rels);
      },
    );

    const loader = createChildrenLoader(ctx());
    await expect(buildTree('A', 1, new Set(), loader, ctx())).rejects.toThrow(
      /Circular BOM reference/,
    );
  });
});
