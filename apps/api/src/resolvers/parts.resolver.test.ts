import { describe, it, expect, vi, beforeEach } from 'vitest';
import { partsResolvers } from './parts.resolver.js';
import { prisma } from '../lib/prisma.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    part: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(prisma);
const ctx = { prisma: mockPrisma, user: null };

const mockUser = { id: 'u1', email: 'test@test.com', name: 'Test', passwordHash: null, googleId: null, avatarUrl: null, createdAt: new Date() };
const authedCtx = { prisma: mockPrisma, user: mockUser };

beforeEach(() => {
  vi.clearAllMocks();
});

const mockPart = {
  id: 'clxxx1',
  partNumber: 'P-001',
  name: 'Injector Valve',
  description: 'Fuel injector valve',
  unit: 'each',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('Query.parts', () => {
  it('returns all parts ordered by createdAt desc', async () => {
    mockPrisma.part.findMany.mockResolvedValue([mockPart]);

    const result = await partsResolvers.Query.parts(null, {}, ctx);

    expect(mockPrisma.part.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([mockPart]);
  });

  it('returns empty array when no parts exist', async () => {
    mockPrisma.part.findMany.mockResolvedValue([]);

    const result = await partsResolvers.Query.parts(null, {}, ctx);

    expect(result).toEqual([]);
  });
});

describe('Query.part', () => {
  it('returns a part by id', async () => {
    mockPrisma.part.findUnique.mockResolvedValue(mockPart);

    const result = await partsResolvers.Query.part(null, { id: 'clxxx1' }, ctx);

    expect(mockPrisma.part.findUnique).toHaveBeenCalledWith({ where: { id: 'clxxx1' } });
    expect(result).toEqual(mockPart);
  });

  it('returns null when part is not found', async () => {
    mockPrisma.part.findUnique.mockResolvedValue(null);

    const result = await partsResolvers.Query.part(null, { id: 'nonexistent' }, ctx);

    expect(result).toBeNull();
  });
});

describe('Mutation.createPart', () => {
  it('creates and returns a new part', async () => {
    const input = { partNumber: 'P-001', name: 'Injector Valve', unit: 'each' };
    mockPrisma.part.create.mockResolvedValue({ ...mockPart, ...input });

    const result = await partsResolvers.Mutation.createPart(null, { input }, authedCtx);

    expect(mockPrisma.part.create).toHaveBeenCalledWith({ data: input });
    expect(result).toMatchObject(input);
  });

  it('passes description through when provided', async () => {
    const input = {
      partNumber: 'P-002',
      name: 'Valve',
      description: 'A valve',
      unit: 'each',
    };
    mockPrisma.part.create.mockResolvedValue({ ...mockPart, ...input });

    await partsResolvers.Mutation.createPart(null, { input }, authedCtx);

    expect(mockPrisma.part.create).toHaveBeenCalledWith({ data: input });
  });

  it('rejects unauthenticated requests', () => {
    const input = { partNumber: 'P-003', name: 'Blocked', unit: 'each' };
    expect(() => partsResolvers.Mutation.createPart(null, { input }, ctx)).toThrow(
      /must be logged in/,
    );
  });
});

describe('Mutation.updatePart', () => {
  it('updates and returns the part', async () => {
    const input = { name: 'Updated Valve' };
    mockPrisma.part.update.mockResolvedValue({ ...mockPart, ...input });

    const result = await partsResolvers.Mutation.updatePart(null, { id: 'clxxx1', input }, authedCtx);

    expect(mockPrisma.part.update).toHaveBeenCalledWith({
      where: { id: 'clxxx1' },
      data: input,
    });
    expect(result).toMatchObject(input);
  });

  it('can update a single field without touching others', async () => {
    const input = { unit: 'kg' };
    mockPrisma.part.update.mockResolvedValue({ ...mockPart, unit: 'kg' });

    await partsResolvers.Mutation.updatePart(null, { id: 'clxxx1', input }, authedCtx);

    expect(mockPrisma.part.update).toHaveBeenCalledWith({
      where: { id: 'clxxx1' },
      data: { unit: 'kg' },
    });
  });
});
