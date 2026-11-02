import { PrismaClient, UserRole, MembershipStatus, ResidentType, VisitorStatus, VisitorPurpose } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding MyCommunity database with realistic sample data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Sample Community
  const community = await prisma.community.upsert({
    where: { code: 'PMH-01' },
    update: {},
    create: {
      name: 'Palm Meadows Heights',
      code: 'PMH-01',
      address: 'Plot 42, Outer Ring Road, Bellandur',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560103',
    },
  });
  console.log(`✅ Community: ${community.name} (Code: ${community.code})`);

  // 2. Create Blocks & Floors
  const blockA = await prisma.block.upsert({
    where: { communityId_name: { communityId: community.id, name: 'Tower A' } },
    update: {},
    create: {
      communityId: community.id,
      name: 'Tower A',
    },
  });

  const floor1 = await prisma.floor.upsert({
    where: { blockId_floorNumber: { blockId: blockA.id, floorNumber: 1 } },
    update: {},
    create: {
      blockId: blockA.id,
      floorNumber: 1,
    },
  });

  const floor2 = await prisma.floor.upsert({
    where: { blockId_floorNumber: { blockId: blockA.id, floorNumber: 2 } },
    update: {},
    create: {
      blockId: blockA.id,
      floorNumber: 2,
    },
  });

  // 3. Create Units (Flats)
  const flatA101 = await prisma.unit.upsert({
    where: { blockId_unitNumber: { blockId: blockA.id, unitNumber: '101' } },
    update: {},
    create: {
      communityId: community.id,
      blockId: blockA.id,
      floorId: floor1.id,
      unitNumber: '101',
      extension: '101',
    },
  });

  const flatA201 = await prisma.unit.upsert({
    where: { blockId_unitNumber: { blockId: blockA.id, unitNumber: '201' } },
    update: {},
    create: {
      communityId: community.id,
      blockId: blockA.id,
      floorId: floor2.id,
      unitNumber: '201',
      extension: '201',
    },
  });
  console.log(`✅ Created Flats: Tower A-101 and Tower A-201`);

  // 4. Create Users: Admin, Guard, Residents
  const adminUser = await prisma.user.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: {
      phone: '9999999999',
      email: 'admin@palmmeadows.org',
      fullName: 'Vikram Mehta (Admin)',
      passwordHash,
    },
  });

  const guardUser = await prisma.user.upsert({
    where: { phone: '8888888888' },
    update: {},
    create: {
      phone: '8888888888',
      email: 'gate1@palmmeadows.org',
      fullName: 'Ramesh Kumar (Gate Guard)',
      passwordHash,
    },
  });

  const resident1 = await prisma.user.upsert({
    where: { phone: '7777777777' },
    update: {},
    create: {
      phone: '7777777777',
      email: 'ananya@example.com',
      fullName: 'Ananya Sharma (Flat A-101)',
      passwordHash,
    },
  });

  const resident2 = await prisma.user.upsert({
    where: { phone: '6666666666' },
    update: {},
    create: {
      phone: '6666666666',
      email: 'suresh@example.com',
      fullName: 'Suresh Patel (Flat A-201)',
      passwordHash,
    },
  });

  // 5. Create Memberships
  await prisma.membership.upsert({
    where: { userId_communityId_unitId: { userId: adminUser.id, communityId: community.id, unitId: null as any } },
    update: {},
    create: {
      userId: adminUser.id,
      communityId: community.id,
      role: UserRole.COMMUNITY_ADMIN,
      status: MembershipStatus.APPROVED,
      isApproved: true,
    },
  }).catch(() => {});

  await prisma.membership.upsert({
    where: { userId_communityId_unitId: { userId: guardUser.id, communityId: community.id, unitId: null as any } },
    update: {},
    create: {
      userId: guardUser.id,
      communityId: community.id,
      role: UserRole.GUARD,
      status: MembershipStatus.APPROVED,
      isApproved: true,
    },
  }).catch(() => {});

  await prisma.membership.upsert({
    where: { userId_communityId_unitId: { userId: resident1.id, communityId: community.id, unitId: flatA101.id } },
    update: {},
    create: {
      userId: resident1.id,
      communityId: community.id,
      unitId: flatA101.id,
      role: UserRole.RESIDENT,
      residentType: ResidentType.OWNER,
      status: MembershipStatus.APPROVED,
      isApproved: true,
    },
  });

  await prisma.membership.upsert({
    where: { userId_communityId_unitId: { userId: resident2.id, communityId: community.id, unitId: flatA201.id } },
    update: {},
    create: {
      userId: resident2.id,
      communityId: community.id,
      unitId: flatA201.id,
      role: UserRole.RESIDENT,
      residentType: ResidentType.TENANT,
      status: MembershipStatus.APPROVED,
      isApproved: true,
    },
  });

  console.log(`✅ Created Memberships: Admin, Guard, and 2 Residents`);

  // 6. Seed Sample Visitor Records demonstrating every state
  // A. PENDING visitor waiting for Flat A-101 approval
  await prisma.visitor.create({
    data: {
      communityId: community.id,
      unitId: flatA101.id,
      guardId: guardUser.id,
      name: 'Deepak Verma',
      phone: '9845011223',
      purpose: VisitorPurpose.GUEST,
      status: VisitorStatus.PENDING,
      verificationCode: '4192',
    },
  });

  // B. APPROVED visitor waiting for guard check-in
  await prisma.visitor.create({
    data: {
      communityId: community.id,
      unitId: flatA101.id,
      guardId: guardUser.id,
      residentId: resident1.id,
      name: 'Swiggy Delivery Partner (Sunil)',
      phone: '9812345678',
      purpose: VisitorPurpose.DELIVERY,
      vehicleNumber: 'KA 05 EZ 8821',
      status: VisitorStatus.APPROVED,
      verificationCode: '8310',
    },
  });

  // C. CHECKED_IN visitor currently inside the premises
  await prisma.visitor.create({
    data: {
      communityId: community.id,
      unitId: flatA201.id,
      guardId: guardUser.id,
      residentId: resident2.id,
      name: 'Urban Company AC Technician (Manoj)',
      phone: '9740112233',
      purpose: VisitorPurpose.HOME_SERVICE,
      vehicleNumber: 'KA 01 HG 3490',
      status: VisitorStatus.CHECKED_IN,
      verificationCode: '1092',
      checkInTime: new Date(Date.now() - 45 * 60 * 1000), // Checked in 45 mins ago
    },
  });

  console.log(`✅ Seeded sample visitors across PENDING, APPROVED, and CHECKED_IN states!`);
  console.log(`\n🎉 Seed Completed! Ready for end-to-end testing.`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
