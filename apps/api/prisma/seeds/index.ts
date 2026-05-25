import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Şirketi',
      slug: 'demo',
      plan: 'business',
      locale: 'tr',
      timezone: 'Europe/Istanbul',
      currency: 'TRY',
    },
  });
  console.log('✅ Organization created:', org.slug);

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: 'admin' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Yönetici',
      slug: 'admin',
      permissions: ['*'],
      isSystem: true,
    },
  });

  const memberRole = await prisma.role.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: 'member' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Üye',
      slug: 'member',
      permissions: ['dashboard.read'],
      isSystem: true,
    },
  });
  console.log('✅ Roles created');

  // Create admin user
  const passwordHash = await bcrypt.hash('Admin123!', 12);
  const adminUser = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      organizationId: org.id,
      email: 'admin@demo.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Kullanıcı',
      roleId: adminRole.id,
      status: 'active',
      emailVerifiedAt: new Date(),
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  // Create demo department
  await prisma.department.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'IT' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Bilgi Teknolojileri',
      code: 'IT',
    },
  });
  console.log('✅ Department created');

  console.log('🎉 Seeding complete!');
  console.log('');
  console.log('📝 Demo credentials:');
  console.log('   URL: http://localhost:3000');
  console.log('   Email: admin@demo.com');
  console.log('   Password: Admin123!');
  console.log('   Organization: demo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
