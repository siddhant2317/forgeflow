import { describe, it, expect, vi, beforeEach } from 'vitest';
import { workOrderResolvers } from './workorder.resolver.js';
import { prisma } from '../lib/prisma.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    workOrder: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    step: {
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const mockPrisma = vi.mocked(prisma);
const mockUser = { id: 'u1', email: 'test@test.com', name: 'Test', passwordHash: null, googleId: null, avatarUrl: null, createdAt: new Date() };
const ctx = { prisma: mockPrisma, user: null };
const authedCtx = { prisma: mockPrisma, user: mockUser };

const mockPart = { id: 'p1', partNumber: 'WO-001', name: 'Engine', unit: 'each' };
const mockStep1 = { id: 's1', workOrderId: 'wo1', description: 'Install', completed: false };
const mockStep2 = { id: 's2', workOrderId: 'wo1', description: 'Test', completed: false };
const mockWO = {
  id: 'wo1',
  title: 'Assemble Engine',
  status: 'PENDING' as const,
  partId: 'p1',
  createdAt: new Date('2024-01-01'),
  part: mockPart,
  steps: [mockStep1, mockStep2],
};

beforeEach(() => vi.clearAllMocks());

describe('Query.workOrders', () => {
  it('returns all work orders when no status filter', async () => {
    mockPrisma.workOrder.findMany.mockResolvedValue([mockWO]);

    const result = await workOrderResolvers.Query.workOrders(null, {}, ctx);

    expect(mockPrisma.workOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
    expect(result).toEqual([mockWO]);
  });

  it('filters by status', async () => {
    mockPrisma.workOrder.findMany.mockResolvedValue([]);

    await workOrderResolvers.Query.workOrders(null, { status: 'COMPLETE' }, ctx);

    expect(mockPrisma.workOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'COMPLETE' } }),
    );
  });
});

describe('Query.workOrder', () => {
  it('returns a work order by id', async () => {
    mockPrisma.workOrder.findUnique.mockResolvedValue(mockWO);

    const result = await workOrderResolvers.Query.workOrder(null, { id: 'wo1' }, ctx);

    expect(mockPrisma.workOrder.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'wo1' } }),
    );
    expect(result).toEqual(mockWO);
  });

  it('returns null when work order not found', async () => {
    mockPrisma.workOrder.findUnique.mockResolvedValue(null);

    const result = await workOrderResolvers.Query.workOrder(null, { id: 'missing' }, ctx);

    expect(result).toBeNull();
  });
});

describe('Mutation.createWorkOrder', () => {
  it('creates work order with steps', async () => {
    const input = { title: 'Assemble', partId: 'p1', steps: ['Step 1', 'Step 2'] };
    mockPrisma.workOrder.create.mockResolvedValue(mockWO);

    const result = await workOrderResolvers.Mutation.createWorkOrder(null, { input }, authedCtx);

    expect(mockPrisma.workOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: 'Assemble',
          partId: 'p1',
          steps: { create: [{ description: 'Step 1' }, { description: 'Step 2' }] },
        }),
      }),
    );
    expect(result).toEqual(mockWO);
  });
});

describe('Mutation.updateWorkOrderStatus', () => {
  it('updates status to IN_PROGRESS', async () => {
    mockPrisma.workOrder.update.mockResolvedValue({ ...mockWO, status: 'IN_PROGRESS' });

    const result = await workOrderResolvers.Mutation.updateWorkOrderStatus(
      null,
      { id: 'wo1', status: 'IN_PROGRESS' },
      authedCtx,
    );

    expect(mockPrisma.workOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'wo1' }, data: { status: 'IN_PROGRESS' } }),
    );
    expect((result as typeof mockWO).status).toBe('IN_PROGRESS');
  });
});

describe('Mutation.completeStep', () => {
  it('marks step completed; auto-completes WO when all steps done', async () => {
    const completedStep = { ...mockStep1, completed: true };
    const allDone = [{ ...mockStep1, completed: true }, { ...mockStep2, completed: true }];

    mockPrisma.step.update.mockResolvedValue(completedStep);
    mockPrisma.step.findMany.mockResolvedValue(allDone);
    mockPrisma.workOrder.update.mockResolvedValue({ ...mockWO, status: 'COMPLETE' });

    await workOrderResolvers.Mutation.completeStep(null, { stepId: 's1' }, authedCtx);

    expect(mockPrisma.workOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'COMPLETE' } }),
    );
  });

  it('sets WO to IN_PROGRESS when first step completes', async () => {
    const completedStep = { ...mockStep1, completed: true };
    const partialDone = [{ ...mockStep1, completed: true }, { ...mockStep2, completed: false }];

    mockPrisma.step.update.mockResolvedValue(completedStep);
    mockPrisma.step.findMany.mockResolvedValue(partialDone);
    mockPrisma.workOrder.update.mockResolvedValue({ ...mockWO, status: 'IN_PROGRESS' });

    await workOrderResolvers.Mutation.completeStep(null, { stepId: 's1' }, authedCtx);

    expect(mockPrisma.workOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'IN_PROGRESS' } }),
    );
  });
});
