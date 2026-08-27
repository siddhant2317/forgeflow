import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inventoryResolvers } from './inventory.resolver.js';
import { prisma } from '../lib/prisma.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    inventoryItem: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    part: {
      findUniqueOrThrow: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(prisma);
const mockUser = { id: 'u1', email: 'test@test.com', name: 'Test', passwordHash: null, googleId: null, avatarUrl: null, createdAt: new Date() };
const ctx = { prisma: mockPrisma, user: null };
const authedCtx = { prisma: mockPrisma, user: mockUser };

const mockPart = { id: 'p1', partNumber: 'INV-001', name: 'Valve', unit: 'each' };
const mockItem = { id: 'inv1', partId: 'p1', location: 'Rack A', quantity: 10, part: mockPart };

beforeEach(() => vi.clearAllMocks());

describe('Query.inventoryItems', () => {
  it('returns all items when no filters given', async () => {
    mockPrisma.inventoryItem.findMany.mockResolvedValue([mockItem]);

    const result = await inventoryResolvers.Query.inventoryItems(null, {}, ctx);

    expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
    expect(result).toEqual([mockItem]);
  });

  it('filters by partId', async () => {
    mockPrisma.inventoryItem.findMany.mockResolvedValue([mockItem]);

    await inventoryResolvers.Query.inventoryItems(null, { partId: 'p1' }, ctx);

    expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { partId: 'p1' } }),
    );
  });

  it('filters by location', async () => {
    mockPrisma.inventoryItem.findMany.mockResolvedValue([mockItem]);

    await inventoryResolvers.Query.inventoryItems(null, { location: 'Rack A' }, ctx);

    expect(mockPrisma.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { location: 'Rack A' } }),
    );
  });

  it('returns empty array when no items found', async () => {
    mockPrisma.inventoryItem.findMany.mockResolvedValue([]);

    const result = await inventoryResolvers.Query.inventoryItems(null, {}, ctx);

    expect(result).toEqual([]);
  });
});

describe('Mutation.addInventoryItem', () => {
  it('creates and returns a new inventory item', async () => {
    const input = { partId: 'p1', location: 'Rack B', quantity: 5 };
    mockPrisma.inventoryItem.create.mockResolvedValue({ ...mockItem, ...input });

    const result = await inventoryResolvers.Mutation.addInventoryItem(null, { input }, authedCtx);

    expect(mockPrisma.inventoryItem.create).toHaveBeenCalledWith({
      data: input,
      include: { part: true },
    });
    expect(result).toMatchObject(input);
  });
});
