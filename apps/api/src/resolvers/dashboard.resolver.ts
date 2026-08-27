import { Context } from '../lib/context.js';

export const dashboardResolvers = {
  ActivityLog: {
    createdAt: (parent: { createdAt: Date }) => parent.createdAt.toISOString(),
  },

  Query: {
    dashboardStats: async (_: unknown, __: unknown, { prisma }: Context) => {
      const [totalParts, openWorkOrders, completedWorkOrdersThisMonth, lowInventoryItems] =
        await Promise.all([
          prisma.part.count(),
          prisma.workOrder.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
          prisma.workOrder.count({
            where: {
              status: 'COMPLETE',
              createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            },
          }),
          prisma.inventoryItem.count({ where: { quantity: { lt: 5 } } }),
        ]);

      return {
        totalParts,
        openWorkOrders,
        lowInventoryCount: lowInventoryItems,
        completedWorkOrdersThisMonth,
      };
    },

    recentActivity: (_: unknown, { limit }: { limit?: number }, { prisma }: Context) =>
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit ?? 20, 100),
      }),
  },
};
