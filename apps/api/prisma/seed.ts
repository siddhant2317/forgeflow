import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding LineForge with Merlin-1D rocket engine data...');

  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.step.deleteMany(),
    prisma.workOrder.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.bOMRelationship.deleteMany(),
    prisma.part.deleteMany(),
  ]);

  const engine = await prisma.part.create({
    data: {
      partNumber: 'M1D-ENG-001',
      name: 'Merlin-1D Engine',
      description: 'Liquid-propellant rocket engine used on Falcon 9',
      unit: 'each',
    },
  });

  const turbopump = await prisma.part.create({
    data: {
      partNumber: 'M1D-TBP-001',
      name: 'Turbopump Assembly',
      description: 'Powers propellant flow at ~2,500 rpm',
      unit: 'each',
    },
  });

  const combustionChamber = await prisma.part.create({
    data: {
      partNumber: 'M1D-CMB-001',
      name: 'Combustion Chamber',
      description: 'Pintle injector combustion chamber operating at 97 bar',
      unit: 'each',
    },
  });

  const nozzle = await prisma.part.create({
    data: {
      partNumber: 'M1D-NZL-001',
      name: 'Regeneratively Cooled Nozzle',
      description: 'Bell nozzle with area ratio 16:1 for sea-level operation',
      unit: 'each',
    },
  });

  const injector = await prisma.part.create({
    data: {
      partNumber: 'M1D-INJ-001',
      name: 'Pintle Injector',
      description: 'Liquid oxygen / RP-1 pintle injector',
      unit: 'each',
    },
  });

  const igniterId = await prisma.part.create({
    data: {
      partNumber: 'M1D-IGN-001',
      name: 'TEA-TEB Igniter',
      description: 'Triethylaluminum / triethylborane pyrophoric igniter',
      unit: 'each',
    },
  });

  const seal = await prisma.part.create({
    data: {
      partNumber: 'M1D-SL-001',
      name: 'High-Temp Combustion Seal',
      description: 'PTFE-coated seal rated to 3,500 K',
      unit: 'each',
    },
  });

  await prisma.bOMRelationship.createMany({
    data: [
      { parentId: engine.id, childId: turbopump.id, quantity: 1 },
      { parentId: engine.id, childId: combustionChamber.id, quantity: 1 },
      { parentId: engine.id, childId: nozzle.id, quantity: 1 },
      { parentId: combustionChamber.id, childId: injector.id, quantity: 1 },
      { parentId: combustionChamber.id, childId: igniterId.id, quantity: 1 },
      { parentId: combustionChamber.id, childId: seal.id, quantity: 6 },
    ],
  });

  await prisma.inventoryItem.createMany({
    data: [
      { partId: engine.id, location: 'Assembly Bay 1', quantity: 3 },
      { partId: turbopump.id, location: 'Rack A-1', quantity: 8 },
      { partId: combustionChamber.id, location: 'Rack A-2', quantity: 5 },
      { partId: nozzle.id, location: 'Rack B-1', quantity: 4 },
      { partId: injector.id, location: 'Rack B-2', quantity: 12 },
      { partId: igniterId.id, location: 'Rack C-1', quantity: 2 },
      { partId: seal.id, location: 'Rack C-2', quantity: 48 },
    ],
  });

  const wo1 = await prisma.workOrder.create({
    data: {
      title: 'Assemble Merlin-1D Engine #F9-47',
      partId: engine.id,
      status: 'IN_PROGRESS',
      steps: {
        create: [
          { description: 'Inspect all components against receiving inspection records' },
          { description: 'Install pintle injector into combustion chamber', completed: true },
          { description: 'Install TEA-TEB igniter and torque to spec' },
          { description: 'Mount turbopump assembly and connect propellant lines' },
          { description: 'Attach regeneratively cooled nozzle and safety-wire bolts' },
          { description: 'Conduct cold-flow propellant system test' },
          { description: 'Record final weights and submit to QA' },
        ],
      },
    },
  });

  const wo2 = await prisma.workOrder.create({
    data: {
      title: 'Turbopump Overhaul — Serial TBP-0042',
      partId: turbopump.id,
      status: 'PENDING',
      steps: {
        create: [
          { description: 'Disassemble turbopump and inspect impeller blades' },
          { description: 'Replace high-speed bearings (p/n BRG-0120)' },
          { description: 'Resurface sealing faces to 0.4 µm Ra' },
          { description: 'Reassemble and perform hydrostatic test at 1.5× MAWP' },
        ],
      },
    },
  });

  await prisma.activityLog.createMany({
    data: [
      {
        action: 'CREATE',
        entityType: 'Part',
        entityId: engine.id,
        description: `Created part ${engine.partNumber}: ${engine.name}`,
      },
      {
        action: 'CREATE',
        entityType: 'WorkOrder',
        entityId: wo1.id,
        description: `Created work order: ${wo1.title}`,
      },
      {
        action: 'CREATE',
        entityType: 'WorkOrder',
        entityId: wo2.id,
        description: `Created work order: ${wo2.title}`,
      },
      {
        action: 'COMPLETE_STEP',
        entityType: 'Step',
        entityId: wo1.id,
        description: 'Completed step: Install pintle injector into combustion chamber',
      },
    ],
  });

  console.log('✅ Seed complete:');
  console.log(`   ${await prisma.part.count()} parts`);
  console.log(`   ${await prisma.bOMRelationship.count()} BOM relationships`);
  console.log(`   ${await prisma.inventoryItem.count()} inventory items`);
  console.log(`   ${await prisma.workOrder.count()} work orders`);
  console.log(`   ${await prisma.activityLog.count()} activity log entries`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
