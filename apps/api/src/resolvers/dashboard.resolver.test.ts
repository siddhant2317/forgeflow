import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardResolvers } from './dashboard.resolver.js';
import { prisma } from '../lib/prisma.js';

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    part: { count: vi.fn() },
    workOrder: { count: vi.fn() },
    inventoryItem: { count: vi.fn() },
    activityLog: { findMany: vi.fn() },
  },
}));

const mockPrisma = vi.mocked(prisma);
const ctx = { prisma: mockPrisma, user: null };

beforeEach(() => vi.clearAllMocks());

describe('Query.dashboardStats', () => {
  it('returns correct aggregated counts', async () => {
    mockPrisma.part.count.mockResolvedValue(12);
    mockPrisma.workOrder.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(5);
    mockPrisma.inventoryItem.count.mockResolvedValue(2);

    const result = await dashboardResolvers.Query.dashboardStats(null, {}, ctx);

    expect(result).toEqual({
      totalParts: 12,
      openWorkOrders: 3,
      lowInventoryCount: 2,
      completedWorkOrdersThisMonth: 5,
    });
  });

  it('returns zeroes when database is empty', async () => {
    mockPrisma.part.count.mockResolvedValue(0);
    mockPrisma.workOrder.count.mockResolvedValue(0);
    mockPrisma.inventoryItem.count.mockResolvedValue(0);

    const result = await dashboardResolvers.Query.dashboardStats(null, {}, ctx);

    expect(result.totalParts).toBe(0);
    expect(result.openWorkOrders).toBe(0);
    expect(result.lowInventoryCount).toBe(0);
    expect(result.completedWorkOrdersThisMonth).toBe(0);
  });
});

describe('Query.recentActivity', () => {
  it('returns activity log entries', async () => {
    const logs = [
      {
        id: 'log1',
        action: 'CREATE',
        entityType: 'Part',
        entityId: 'p1',
        description: 'Created part P-001',
        createdAt: new Date(),
      },
    ];
    mockPrisma.activityLog.findMany.mockResolvedValue(logs);

    const result = await dashboardResolvers.Query.recentActivity(null, { limit: 10 }, ctx);

    expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 10, orderBy: { createdAt: 'desc' } }),
    );
    expect(result).toEqual(logs);
  });

  it('defaults to limit 20 when not specified', async () => {
    mockPrisma.activityLog.findMany.mockResolvedValue([]);

    await dashboardResolvers.Query.recentActivity(null, {}, ctx);

    expect(mockPrisma.activityLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 20 }),
    );
  });
});
