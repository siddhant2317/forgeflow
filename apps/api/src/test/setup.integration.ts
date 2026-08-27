import { prisma } from '../lib/prisma.js';

beforeEach(async () => {
  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.step.deleteMany(),
    prisma.workOrder.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.bOMRelationship.deleteMany(),
    prisma.part.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
