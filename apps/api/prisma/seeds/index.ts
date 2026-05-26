import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed data oluşturuluyor...');

  // Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-sirket' },
    update: {},
    create: {
      name: 'Demo Şirket A.Ş.',
      slug: 'demo-sirket',
      plan: 'pro',
      locale: 'tr',
      timezone: 'Europe/Istanbul',
      currency: 'TRY',
    },
  });

  // Roles
  const adminRole = await prisma.role.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: 'admin' } },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Yönetici',
      slug: 'admin',
      permissions: ['dashboard.read', 'sales.read', 'sales.write', 'sales.delete', 'inventory.read', 'inventory.write', 'inventory.delete', 'finance.read', 'finance.write', 'hr.read', 'hr.write', 'admin.users', 'admin.roles', 'admin.settings'],
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
      permissions: ['dashboard.read', 'sales.read', 'inventory.read'],
      isSystem: true,
    },
  });

  // Admin user
  const passwordHash = await bcrypt.hash('Admin1234!', 12);
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

  // Departments
  const departments = await Promise.all([
    prisma.department.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'SATIS' } }, update: {}, create: { organizationId: org.id, name: 'Satış', code: 'SATIS' } }),
    prisma.department.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'IK' } }, update: {}, create: { organizationId: org.id, name: 'İnsan Kaynakları', code: 'IK' } }),
    prisma.department.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'MUHASEBE' } }, update: {}, create: { organizationId: org.id, name: 'Muhasebe', code: 'MUHASEBE' } }),
    prisma.department.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'DEPO' } }, update: {}, create: { organizationId: org.id, name: 'Depo', code: 'DEPO' } }),
  ]);

  // Product Categories
  const catElektronik = await prisma.productCategory.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: 'elektronik' } },
    update: {},
    create: { organizationId: org.id, name: 'Elektronik', slug: 'elektronik' },
  });
  const catOfis = await prisma.productCategory.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: 'ofis' } },
    update: {},
    create: { organizationId: org.id, name: 'Ofis Malzemeleri', slug: 'ofis' },
  });

  // Products
  const products = await Promise.all([
    prisma.product.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'PRD-001' } }, update: {}, create: { organizationId: org.id, code: 'PRD-001', name: 'Laptop Pro 15"', unit: 'adet', purchasePrice: 15000, salePrice: 22000, vatRate: 20, minStock: 5, currentStock: 23, categoryId: catElektronik.id, isActive: true } }),
    prisma.product.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'PRD-002' } }, update: {}, create: { organizationId: org.id, code: 'PRD-002', name: 'Kablosuz Mouse', unit: 'adet', purchasePrice: 200, salePrice: 350, vatRate: 20, minStock: 20, currentStock: 45, categoryId: catElektronik.id, isActive: true } }),
    prisma.product.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'PRD-003' } }, update: {}, create: { organizationId: org.id, code: 'PRD-003', name: 'A4 Kağıt (500 yaprak)', unit: 'paket', purchasePrice: 80, salePrice: 120, vatRate: 8, minStock: 50, currentStock: 3, categoryId: catOfis.id, isActive: true } }),
    prisma.product.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'PRD-004' } }, update: {}, create: { organizationId: org.id, code: 'PRD-004', name: 'Monitör 27"', unit: 'adet', purchasePrice: 8000, salePrice: 12500, vatRate: 20, minStock: 3, currentStock: 8, categoryId: catElektronik.id, isActive: true } }),
  ]);

  // Customers
  const customers = await Promise.all([
    prisma.customer.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'MUS-001' } }, update: {}, create: { organizationId: org.id, code: 'MUS-001', name: 'Acme Teknoloji A.Ş.', email: 'info@acme.com', phone: '02121234567', type: 'corporate', taxNumber: '1234567890', status: 'active', creditLimit: 500000 } }),
    prisma.customer.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'MUS-002' } }, update: {}, create: { organizationId: org.id, code: 'MUS-002', name: 'Beta Yazılım Ltd.', email: 'contact@beta.com', phone: '02129876543', type: 'corporate', status: 'active', creditLimit: 250000 } }),
    prisma.customer.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'MUS-003' } }, update: {}, create: { organizationId: org.id, code: 'MUS-003', name: 'Ahmet Yılmaz', email: 'ahmet@gmail.com', phone: '05301234567', type: 'individual', status: 'active', creditLimit: 50000 } }),
  ]);

  // Suppliers
  const suppliers = await Promise.all([
    prisma.supplier.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'TED-001' } }, update: {}, create: { organizationId: org.id, code: 'TED-001', name: 'Delta Tedarik A.Ş.', email: 'info@delta.com', phone: '02161234567', paymentTerms: 30, currency: 'TRY', status: 'active' } }),
    prisma.supplier.upsert({ where: { organizationId_code: { organizationId: org.id, code: 'TED-002' } }, update: {}, create: { organizationId: org.id, code: 'TED-002', name: 'Epsilon İthalat Ltd.', email: 'contact@epsilon.com', phone: '02129001122', paymentTerms: 60, currency: 'USD', status: 'active' } }),
  ]);

  // Employees
  const employees = await Promise.all([
    prisma.employee.upsert({ where: { organizationId_employeeNumber: { organizationId: org.id, employeeNumber: 'EMP-001' } }, update: {}, create: { organizationId: org.id, employeeNumber: 'EMP-001', firstName: 'Mehmet', lastName: 'Demir', email: 'mehmet@demo.com', position: 'Satış Müdürü', departmentId: departments[0].id, startDate: new Date('2022-01-15'), salary: 25000, salaryType: 'monthly', status: 'active' } }),
    prisma.employee.upsert({ where: { organizationId_employeeNumber: { organizationId: org.id, employeeNumber: 'EMP-002' } }, update: {}, create: { organizationId: org.id, employeeNumber: 'EMP-002', firstName: 'Ayşe', lastName: 'Kaya', email: 'ayse@demo.com', position: 'İK Uzmanı', departmentId: departments[1].id, startDate: new Date('2021-06-01'), salary: 18000, salaryType: 'monthly', status: 'active' } }),
    prisma.employee.upsert({ where: { organizationId_employeeNumber: { organizationId: org.id, employeeNumber: 'EMP-003' } }, update: {}, create: { organizationId: org.id, employeeNumber: 'EMP-003', firstName: 'Can', lastName: 'Öztürk', email: 'can@demo.com', position: 'Muhasebe Uzmanı', departmentId: departments[2].id, startDate: new Date('2023-03-01'), salary: 20000, salaryType: 'monthly', status: 'active' } }),
  ]);

  // Chart of Accounts (Hesap Planı - Tek Düzen)
  const coaGroups = [
    { code: '100', name: 'Kasa', type: 'asset' },
    { code: '102', name: 'Bankalar', type: 'asset' },
    { code: '120', name: 'Alıcılar', type: 'asset' },
    { code: '153', name: 'Ticari Mallar', type: 'asset' },
    { code: '320', name: 'Satıcılar', type: 'liability' },
    { code: '391', name: 'Hesaplanan KDV', type: 'liability' },
    { code: '500', name: 'Sermaye', type: 'equity' },
    { code: '600', name: 'Yurt İçi Satışlar', type: 'revenue' },
    { code: '620', name: 'Satılan Ticari Mallar Maliyeti', type: 'expense' },
    { code: '770', name: 'Genel Yönetim Giderleri', type: 'expense' },
  ];
  for (const acc of coaGroups) {
    await prisma.chartOfAccount.upsert({
      where: { organizationId_code: { organizationId: org.id, code: acc.code } },
      update: {},
      create: { organizationId: org.id, ...acc },
    });
  }

  // Notifications (sample)
  await prisma.notification.createMany({
    data: [
      { organizationId: org.id, userId: adminUser.id, type: 'stock_alert', title: 'Düşük Stok Uyarısı', body: 'A4 Kağıt stoğu kritik seviyede (3 paket)', isRead: false },
      { organizationId: org.id, userId: adminUser.id, type: 'invoice', title: 'Yeni Fatura', body: 'Acme Teknoloji faturası oluşturuldu', isRead: true },
    ],
    skipDuplicates: true,
  });

  // ─── FAZ 11: Budget, Deals, ExchangeRates ───────────────────────────────────

  // Exchange Rates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.exchangeRate.upsert({
    where: { organizationId_baseCurrency_targetCurrency_date: { organizationId: org.id, baseCurrency: 'USD', targetCurrency: 'TRY', date: today } },
    update: { rate: 32.50 },
    create: { organizationId: org.id, baseCurrency: 'USD', targetCurrency: 'TRY', rate: 32.50, date: today, source: 'seed' },
  });
  await prisma.exchangeRate.upsert({
    where: { organizationId_baseCurrency_targetCurrency_date: { organizationId: org.id, baseCurrency: 'EUR', targetCurrency: 'TRY', date: today } },
    update: { rate: 35.20 },
    create: { organizationId: org.id, baseCurrency: 'EUR', targetCurrency: 'TRY', rate: 35.20, date: today, source: 'seed' },
  });
  await prisma.exchangeRate.upsert({
    where: { organizationId_baseCurrency_targetCurrency_date: { organizationId: org.id, baseCurrency: 'GBP', targetCurrency: 'TRY', date: today } },
    update: { rate: 41.80 },
    create: { organizationId: org.id, baseCurrency: 'GBP', targetCurrency: 'TRY', rate: 41.80, date: today, source: 'seed' },
  });

  // Budget
  const budget = await prisma.budget.create({
    data: {
      organizationId: org.id,
      name: '2025 Yıllık Bütçe',
      type: 'annual',
      status: 'active',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      currency: 'TRY',
      totalAmount: 5000000,
      lines: {
        create: [
          { category: 'personnel', description: 'Personel Giderleri', plannedAmount: 2500000, actualAmount: 1800000 },
          { category: 'marketing', description: 'Pazarlama & Reklam', plannedAmount: 500000, actualAmount: 320000 },
          { category: 'operations', description: 'Operasyonel Giderler', plannedAmount: 800000, actualAmount: 650000 },
          { category: 'capex', description: 'Yatırım Harcamaları', plannedAmount: 700000, actualAmount: 200000 },
          { category: 'other', description: 'Diğer Giderler', plannedAmount: 500000, actualAmount: 180000 },
        ],
      },
    },
  });

  // CRM Deals
  const firstCustomer = customers[0];
  if (firstCustomer && budget) {
    await prisma.deal.create({
      data: {
        organizationId: org.id,
        title: 'ERP Genişletme Projesi',
        customerId: firstCustomer.id,
        stage: 'proposal',
        value: 250000,
        probability: 60,
        expectedClose: new Date(Date.now() + 30 * 86400000),
        description: 'Mevcut ERP sisteminin yeni modüllerle genişletilmesi',
        activities: {
          create: [
            { type: 'meeting', title: 'İlk Keşif Toplantısı', description: 'Müşteri ihtiyaçlarının belirlenmesi', completedAt: new Date() },
            { type: 'email', title: 'Teklif Gönderimi', description: 'Teknik ve ticari teklif gönderildi', completedAt: new Date() },
            { type: 'call', title: 'Takip Görüşmesi', description: 'Teklif değerlendirmesi', dueAt: new Date(Date.now() + 7 * 86400000) },
          ],
        },
      },
    });

    await prisma.deal.create({
      data: {
        organizationId: org.id,
        title: 'Yıllık Bakım Sözleşmesi',
        customerId: customers[1]?.id,
        stage: 'negotiation',
        value: 120000,
        probability: 80,
        expectedClose: new Date(Date.now() + 14 * 86400000),
      },
    });

    await prisma.deal.create({
      data: {
        organizationId: org.id,
        title: 'Bulut Altyapısı Kurulumu',
        stage: 'qualification',
        value: 85000,
        probability: 30,
        expectedClose: new Date(Date.now() + 60 * 86400000),
      },
    });

    await prisma.deal.create({
      data: {
        organizationId: org.id,
        title: 'Mobil Uygulama Geliştirme',
        customerId: customers[2]?.id,
        stage: 'won',
        value: 180000,
        probability: 100,
        closedAt: new Date(Date.now() - 7 * 86400000),
      },
    });
  }

  // ─── FAZ 12: Projects, Assets, Logistics, Document Templates ──────────────

  // Asset Category
  const itCategory = await prisma.assetCategory.create({
    data: {
      organizationId: org.id,
      name: 'Bilişim Ekipmanları',
      depreciationMethod: 'straight_line',
      usefulLifeYears: 5,
      salvageRatePct: 0,
    },
  });

  const furnitureCategory = await prisma.assetCategory.create({
    data: {
      organizationId: org.id,
      name: 'Mobilya & Demirbaş',
      depreciationMethod: 'straight_line',
      usefulLifeYears: 10,
      salvageRatePct: 5,
    },
  });

  // Assets
  await prisma.asset.createMany({
    data: [
      { organizationId: org.id, categoryId: itCategory.id, code: 'DMB-001', name: 'Dell Laptop XPS 15', purchasePrice: 45000, currentValue: 36000, salvageValue: 0, usefulLifeYears: 5, purchaseDate: new Date('2023-01-15'), status: 'active', location: 'Genel Müdür Ofisi' },
      { organizationId: org.id, categoryId: itCategory.id, code: 'DMB-002', name: 'HP LaserJet Pro Yazıcı', purchasePrice: 12000, currentValue: 8000, salvageValue: 500, usefulLifeYears: 5, purchaseDate: new Date('2023-03-01'), status: 'active', location: 'Muhasebe' },
      { organizationId: org.id, categoryId: furnitureCategory.id, code: 'DMB-003', name: 'Toplantı Masası Seti', purchasePrice: 25000, currentValue: 22000, salvageValue: 1000, usefulLifeYears: 10, purchaseDate: new Date('2022-06-01'), status: 'active', location: 'Toplantı Salonu' },
    ],
  });

  // Project
  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      code: 'PRJ-0001',
      name: 'ERP Dijital Dönüşüm',
      description: 'Şirket geneli dijital dönüşüm ve ERP entegrasyon projesi',
      status: 'active',
      priority: 'high',
      customerId: customers[0]?.id,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      budget: 500000,
      progress: 35,
      color: '#6366f1',
    },
  });

  await prisma.projectMilestone.createMany({
    data: [
      { projectId: project.id, name: 'Analiz & Planlama', dueDate: new Date('2025-03-31'), status: 'completed', completedAt: new Date('2025-03-25') },
      { projectId: project.id, name: 'Geliştirme Faz 1', dueDate: new Date('2025-06-30'), status: 'pending' },
      { projectId: project.id, name: 'Test & Kabul', dueDate: new Date('2025-09-30'), status: 'pending' },
      { projectId: project.id, name: 'Canlıya Geçiş', dueDate: new Date('2025-12-15'), status: 'pending' },
    ],
  });

  await prisma.projectTask.createMany({
    data: [
      { projectId: project.id, title: 'Mevcut süreçlerin dokümantasyonu', status: 'done', priority: 'high', estimatedHours: 40, loggedHours: 38 },
      { projectId: project.id, title: 'Kullanıcı gereksinim analizi', status: 'done', priority: 'high', estimatedHours: 24, loggedHours: 26 },
      { projectId: project.id, title: 'Modül geliştirme - Satış', status: 'in_progress', priority: 'high', estimatedHours: 80, loggedHours: 45 },
      { projectId: project.id, title: 'Modül geliştirme - Muhasebe', status: 'todo', priority: 'medium', estimatedHours: 60, loggedHours: 0 },
      { projectId: project.id, title: 'Entegrasyon testleri', status: 'todo', priority: 'high', estimatedHours: 40, loggedHours: 0 },
    ],
  });

  // Shipment
  if (customers[0]) {
    await prisma.shipment.create({
      data: {
        organizationId: org.id,
        trackingNumber: 'ERP-ABC123DEF456',
        customerId: customers[0].id,
        carrier: 'Aras Kargo',
        status: 'in_transit',
        origin: { address: 'Atatürk Cad. No:1', city: 'İstanbul', country: 'Türkiye', postalCode: '34000' },
        destination: { address: 'Kızılay Meydanı No:5', city: 'Ankara', country: 'Türkiye', postalCode: '06000' },
        weight: 2.5,
        shippingCost: 150,
        estimatedDelivery: new Date(Date.now() + 2 * 86400000),
        events: {
          create: [
            { status: 'pending', description: 'Sevkiyat oluşturuldu', occurredAt: new Date(Date.now() - 3 * 86400000) },
            { status: 'picked_up', location: 'İstanbul Şubesi', description: 'Kargoya teslim edildi', occurredAt: new Date(Date.now() - 2 * 86400000) },
            { status: 'in_transit', location: 'Ankara Dağıtım Merkezi', description: 'Dağıtım merkezine ulaştı', occurredAt: new Date(Date.now() - 86400000) },
          ],
        },
      },
    });
  }

  console.log('✅ Seed data başarıyla oluşturuldu!');
  console.log(`   Org: ${org.name} (slug: ${org.slug})`);
  console.log(`   Admin: admin@demo.com / Admin1234!`);
  console.log(`   ${products.length} ürün, ${customers.length} müşteri, ${suppliers.length} tedarikçi, ${employees.length} çalışan`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
