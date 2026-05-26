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

  // ── FAZ 13: Kalite Kontrol, İşe Alım, Eğitim, Kontrat, Bakım ─────────────

  // Quality Inspection
  const existingQI = await prisma.qualityInspection.findFirst({ where: { organizationId: org.id } });
  if (!existingQI) {
    await prisma.qualityInspection.create({
      data: {
        organizationId: org.id,
        inspectionNumber: 'QI-SEED01',
        type: 'incoming',
        status: 'in_progress',
        sampleSize: 10,
        passCount: 7,
        failCount: 1,
        notes: 'Periyodik kalite kontrol muayenesi',
        inspectorId: adminUser.id,
        checkItems: {
          create: [
            { criterion: 'Ambalaj bütünlüğü', checkType: 'visual', expectedValue: 'Hasarsız', result: 'pass', actualValue: 'Hasarsız', sortOrder: 0 },
            { criterion: 'Ürün boyutu', checkType: 'measurement', expectedValue: '100±2mm', result: 'pass', actualValue: '101mm', sortOrder: 1 },
            { criterion: 'Renk uyumu', checkType: 'visual', expectedValue: 'RAL 9003', result: 'fail', actualValue: 'RAL 9002', sortOrder: 2 },
            { criterion: 'İşlevsellik testi', checkType: 'functional', expectedValue: 'Çalışıyor', result: 'pass', sortOrder: 3 },
          ],
        },
        defects: {
          create: [
            { title: 'Renk uyumsuzluğu', severity: 'minor', category: 'visual', quantity: 2, status: 'open' },
          ],
        },
      },
    });
  }

  // Job Posting
  const existingJob = await prisma.jobPosting.findFirst({ where: { organizationId: org.id } });
  if (!existingJob) {
    const posting = await prisma.jobPosting.create({
      data: {
        organizationId: org.id,
        createdById: adminUser.id,
        departmentId: departments[0].id,
        title: 'Kıdemli Yazılım Geliştirici',
        workType: 'full_time',
        experienceLevel: 'senior',
        headcount: 2,
        status: 'open',
        location: 'İstanbul (Hibrit)',
        description: 'Node.js ve React deneyimli yazılım geliştirici aranmaktadır.',
        requirements: 'En az 5 yıl deneyim, TypeScript bilgisi',
        salaryMin: 50000,
        salaryMax: 80000,
        currency: 'TRY',
        publishedAt: new Date(),
      },
    });
    // Create a candidate and application
    const candidate = await prisma.candidate.create({
      data: {
        organizationId: org.id,
        firstName: 'Mehmet',
        lastName: 'Çelik',
        email: 'mehmet.celik@example.com',
        currentTitle: 'Yazılım Geliştirici',
        currentCompany: 'Tech Corp',
        yearsOfExp: 6,
        source: 'linkedin',
        skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      },
    });
    await prisma.jobApplication.create({
      data: { postingId: posting.id, candidateId: candidate.id, stage: 'interview', rating: 4 },
    });
  }

  // Training Program
  const existingTraining = await prisma.trainingProgram.findFirst({ where: { organizationId: org.id } });
  if (!existingTraining) {
    await prisma.trainingProgram.create({
      data: {
        organizationId: org.id,
        createdById: adminUser.id,
        title: 'İş Güvenliği ve Acil Durum Prosedürleri',
        category: 'safety',
        format: 'classroom',
        durationHours: 8,
        isMandatory: true,
        isActive: true,
        provider: 'İç Eğitim',
        enrollments: {
          create: employees.slice(0, 3).map((emp) => ({
            employeeId: emp.id,
            status: 'enrolled',
          })),
        },
      },
    });
    await prisma.trainingProgram.create({
      data: {
        organizationId: org.id,
        createdById: adminUser.id,
        title: 'Liderlik ve İletişim Becerileri',
        category: 'leadership',
        format: 'blended',
        durationHours: 16,
        isMandatory: false,
        isActive: true,
        cost: 2500,
        provider: 'McKinsey Academy',
      },
    });
  }

  // Contract
  const existingContract = await prisma.contract.findFirst({ where: { organizationId: org.id } });
  if (!existingContract) {
    await prisma.contract.create({
      data: {
        organizationId: org.id,
        ownerId: adminUser.id,
        customerId: customers[0].id,
        contractNumber: 'CNT-SAL-2025-SEED1',
        title: 'Yazılım Lisans Sözleşmesi',
        type: 'service',
        status: 'active',
        partyName: customers[0].name,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        value: 120000,
        currency: 'TRY',
        autoRenew: true,
        renewalNoticeDays: 30,
        paymentTerms: 'Aylık peşin',
        signedAt: new Date('2024-12-15'),
      },
    });
    await prisma.contract.create({
      data: {
        organizationId: org.id,
        ownerId: adminUser.id,
        supplierId: suppliers[0].id,
        contractNumber: 'CNT-PUR-2025-SEED2',
        title: 'Hammadde Tedarik Sözleşmesi',
        type: 'purchase',
        status: 'active',
        partyName: suppliers[0].name,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
        value: 500000,
        currency: 'TRY',
        autoRenew: false,
      },
    });
  }

  // Maintenance Request
  const existingMR = await prisma.maintenanceRequest.findFirst({ where: { organizationId: org.id } });
  if (!existingMR) {
    const mr = await prisma.maintenanceRequest.create({
      data: {
        organizationId: org.id,
        requestedById: adminUser.id,
        requestNumber: 'MNT-2025-SEED1',
        title: 'Klima Bakımı - 3. Kat Ofisler',
        category: 'hvac',
        priority: 'medium',
        status: 'open',
        location: '3. Kat, Açık Ofis',
        description: 'Klima filtreleri temizliği ve periyodik bakım yapılması gerekiyor.',
        estimatedCost: 1500,
      },
    });
    await prisma.maintenanceComment.create({
      data: {
        requestId: mr.id,
        authorId: adminUser.id,
        content: 'Servis talebi oluşturuldu, teknik ekip bilgilendirildi.',
      },
    });
    await prisma.maintenanceRequest.create({
      data: {
        organizationId: org.id,
        requestedById: adminUser.id,
        requestNumber: 'MNT-2025-SEED2',
        title: 'Sunucu Odası UPS Arızası',
        category: 'it',
        priority: 'critical',
        status: 'in_progress',
        location: 'Sunucu Odası, Bodrum Kat',
        description: 'UPS sistemi alarm veriyor, acil müdahale gerekiyor.',
        estimatedCost: 8000,
        startedAt: new Date(),
      },
    });
  }

  // ── Faz 14: Manufacturing ──────────────────────────────────────────────────
  const wc1 = await prisma.workCenter.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'WC-MONTAJ' } },
    update: {},
    create: {
      organizationId: org.id,
      code: 'WC-MONTAJ',
      name: 'Montaj Hattı',
      description: 'Ana montaj üretim hattı',
      capacity: 8,
      costPerHour: 250,
      isActive: true,
    },
  });

  const wc2 = await prisma.workCenter.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'WC-TEST' } },
    update: {},
    create: {
      organizationId: org.id,
      code: 'WC-TEST',
      name: 'Test & Kalite',
      description: 'Ürün test ve kalite kontrol',
      capacity: 4,
      costPerHour: 150,
      isActive: true,
    },
  });

  // BOM for Laptop Pro
  const bom = await prisma.billOfMaterial.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'BOM-LAP-001' } },
    update: {},
    create: {
      organizationId: org.id,
      code: 'BOM-LAP-001',
      name: 'Laptop Pro 15" Reçetesi',
      productId: products[0].id,
      version: '1.0',
      status: 'active',
      quantity: 1,
      unit: 'adet',
      leadTimeDays: 3,
      items: {
        create: [
          { componentId: products[1].id, quantity: 1, unit: 'adet', scrapRate: 0.02, sortOrder: 1 },
          { componentId: products[3].id, quantity: 1, unit: 'adet', scrapRate: 0.01, sortOrder: 2 },
        ],
      },
    },
  });

  // Production Order
  await prisma.productionOrder.upsert({
    where: { organizationId_orderNumber: { organizationId: org.id, orderNumber: 'URT-2025-0001' } },
    update: {},
    create: {
      organizationId: org.id,
      orderNumber: 'URT-2025-0001',
      productId: products[0].id,
      bomId: bom.id,
      quantity: 10,
      unit: 'adet',
      status: 'in_progress',
      priority: 'high',
      scheduledStart: new Date('2025-06-01'),
      scheduledEnd: new Date('2025-06-15'),
      actualStart: new Date('2025-06-02'),
      producedQty: 6,
      scrapQty: 0,
      createdById: adminUser.id,
      notes: 'Müşteri siparişi için acil üretim',
      operations: {
        create: [
          {
            sequence: 10,
            name: 'Parça Montajı',
            workCenterId: wc1.id,
            plannedHours: 2,
            status: 'completed',
            startedAt: new Date('2025-06-02T08:00:00'),
            completedAt: new Date('2025-06-02T10:00:00'),
          },
          {
            sequence: 20,
            name: 'Test & Kontrol',
            workCenterId: wc2.id,
            plannedHours: 1,
            status: 'in_progress',
            startedAt: new Date('2025-06-03T08:00:00'),
          },
        ],
      },
    },
  });

  // ── Faz 14: KPI ───────────────────────────────────────────────────────────
  const kpiRevenue = await prisma.kpiDefinition.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'KPI-GELIR' } },
    update: {},
    create: {
      organizationId: org.id,
      code: 'KPI-GELIR',
      name: 'Aylık Gelir',
      description: 'Toplam aylık satış geliri',
      category: 'financial',
      unit: 'TRY',
      direction: 'higher_better',
      frequency: 'monthly',
      ownerId: adminUser.id,
      isActive: true,
    },
  });

  const kpiSales = await prisma.kpiDefinition.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'KPI-SATIS' } },
    update: {},
    create: {
      organizationId: org.id,
      code: 'KPI-SATIS',
      name: 'Satış Adet',
      description: 'Aylık satış sipariş adedi',
      category: 'sales',
      unit: 'adet',
      direction: 'higher_better',
      frequency: 'monthly',
      ownerId: adminUser.id,
      isActive: true,
    },
  });

  const kpiCust = await prisma.kpiDefinition.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'KPI-MEMNUN' } },
    update: {},
    create: {
      organizationId: org.id,
      code: 'KPI-MEMNUN',
      name: 'Müşteri Memnuniyeti',
      description: 'Ortalama müşteri memnuniyet skoru',
      category: 'quality',
      unit: '%',
      direction: 'higher_better',
      frequency: 'monthly',
      ownerId: adminUser.id,
      isActive: true,
    },
  });

  // KPI Values for recent months
  const periods = ['2025-03', '2025-04', '2025-05', '2025-06'];
  const revenueValues = [850000, 920000, 780000, 1050000];
  const salesValues = [42, 51, 38, 63];
  const custValues = [82, 88, 85, 91];

  for (let i = 0; i < periods.length; i++) {
    await prisma.kpiValue.upsert({
      where: { kpiId_period: { kpiId: kpiRevenue.id, period: periods[i] } },
      update: {},
      create: { kpiId: kpiRevenue.id, period: periods[i], value: revenueValues[i], recordedById: adminUser.id },
    });
    await prisma.kpiValue.upsert({
      where: { kpiId_period: { kpiId: kpiSales.id, period: periods[i] } },
      update: {},
      create: { kpiId: kpiSales.id, period: periods[i], value: salesValues[i], recordedById: adminUser.id },
    });
    await prisma.kpiValue.upsert({
      where: { kpiId_period: { kpiId: kpiCust.id, period: periods[i] } },
      update: {},
      create: { kpiId: kpiCust.id, period: periods[i], value: custValues[i], recordedById: adminUser.id },
    });
  }

  // KPI Targets for current period
  await prisma.kpiTarget.upsert({
    where: { kpiId_period: { kpiId: kpiRevenue.id, period: '2025-06' } },
    update: {},
    create: { kpiId: kpiRevenue.id, period: '2025-06', target: 1000000, warningThreshold: 800000, criticalThreshold: 600000, setById: adminUser.id },
  });
  await prisma.kpiTarget.upsert({
    where: { kpiId_period: { kpiId: kpiSales.id, period: '2025-06' } },
    update: {},
    create: { kpiId: kpiSales.id, period: '2025-06', target: 60, warningThreshold: 45, criticalThreshold: 30, setById: adminUser.id },
  });
  await prisma.kpiTarget.upsert({
    where: { kpiId_period: { kpiId: kpiCust.id, period: '2025-06' } },
    update: {},
    create: { kpiId: kpiCust.id, period: '2025-06', target: 90, warningThreshold: 75, criticalThreshold: 60, setById: adminUser.id },
  });

  // ── Faz 14: Calendar Events ───────────────────────────────────────────────
  const ev1 = await prisma.calendarEvent.create({
    data: {
      organizationId: org.id,
      title: 'Q2 Satış Değerlendirme Toplantısı',
      type: 'meeting',
      startDate: new Date('2025-06-10T10:00:00'),
      endDate: new Date('2025-06-10T12:00:00'),
      location: 'Toplantı Odası A',
      description: 'İkinci çeyrek satış performansı değerlendirmesi',
      isAllDay: false,
      createdById: adminUser.id,
    },
  });
  await prisma.eventAttendee.create({
    data: { eventId: ev1.id, userId: adminUser.id, status: 'accepted' },
  });

  await prisma.calendarEvent.create({
    data: {
      organizationId: org.id,
      title: 'Üretim Planlama',
      type: 'task',
      startDate: new Date('2025-06-12T09:00:00'),
      endDate: new Date('2025-06-12T10:00:00'),
      isAllDay: false,
      description: 'Temmuz ayı üretim planlaması',
      createdById: adminUser.id,
    },
  });

  await prisma.calendarEvent.create({
    data: {
      organizationId: org.id,
      title: 'Acme Teknoloji Ziyareti',
      type: 'customer_visit',
      startDate: new Date('2025-06-15T14:00:00'),
      endDate: new Date('2025-06-15T16:00:00'),
      location: 'Acme Teknoloji Ofisi',
      isAllDay: false,
      entityType: 'customer',
      entityId: customers[0].id,
      createdById: adminUser.id,
    },
  });

  // ── Faz 15: Sales Quotes ──────────────────────────────────────────────────
  await prisma.salesQuote.upsert({
    where: { organizationId_quoteNumber: { organizationId: org.id, quoteNumber: 'TEK-2025-0001' } },
    update: {},
    create: {
      organizationId: org.id,
      quoteNumber: 'TEK-2025-0001',
      customerId: customers[0].id,
      createdById: adminUser.id,
      status: 'sent',
      validUntil: new Date('2025-07-31'),
      currency: 'TRY',
      notes: 'Acme Teknoloji için yıllık donanım teklifi',
      subtotal: 44000,
      taxAmount: 8800,
      totalAmount: 52800,
      items: {
        create: [
          { productId: products[0].id, description: 'Laptop Pro 15"', quantity: 2, unit: 'adet', unitPrice: 22000, discount: 0, vatRate: 20, totalAmount: 52800, sortOrder: 0 },
        ],
      },
    },
  });

  await prisma.salesQuote.upsert({
    where: { organizationId_quoteNumber: { organizationId: org.id, quoteNumber: 'TEK-2025-0002' } },
    update: {},
    create: {
      organizationId: org.id,
      quoteNumber: 'TEK-2025-0002',
      customerId: customers[1].id,
      createdById: adminUser.id,
      status: 'draft',
      validUntil: new Date('2025-08-15'),
      currency: 'TRY',
      subtotal: 3500,
      taxAmount: 700,
      totalAmount: 4200,
      items: {
        create: [
          { productId: products[1].id, description: 'Kablosuz Mouse x10', quantity: 10, unit: 'adet', unitPrice: 350, discount: 0, vatRate: 20, totalAmount: 4200, sortOrder: 0 },
        ],
      },
    },
  });

  // ── Faz 15: Purchase Requests ─────────────────────────────────────────────
  await prisma.purchaseRequest.upsert({
    where: { organizationId_requestNumber: { organizationId: org.id, requestNumber: 'SAT-2025-0001' } },
    update: {},
    create: {
      organizationId: org.id,
      requestNumber: 'SAT-2025-0001',
      requestedById: adminUser.id,
      departmentId: departments[0].id,
      status: 'pending',
      priority: 'high',
      neededBy: new Date('2025-07-01'),
      notes: 'Satış ekibi için laptop ihtiyacı',
      items: {
        create: [
          { productId: products[0].id, description: 'Laptop Pro 15"', quantity: 3, unit: 'adet', estimatedPrice: 15000 },
          { productId: products[1].id, description: 'Kablosuz Mouse', quantity: 3, unit: 'adet', estimatedPrice: 200 },
        ],
      },
    },
  });

  // ── Faz 15: Vehicles ──────────────────────────────────────────────────────
  await prisma.vehicle.upsert({
    where: { organizationId_plateNumber: { organizationId: org.id, plateNumber: '34 ABC 123' } },
    update: {},
    create: {
      organizationId: org.id,
      plateNumber: '34 ABC 123',
      brand: 'Ford',
      model: 'Transit',
      year: 2022,
      type: 'van',
      status: 'active',
      fuelType: 'diesel',
      currentMileage: 45000,
      nextServiceAt: 50000,
      driverName: 'Mehmet Demir',
      insuranceExpiry: new Date('2026-03-15'),
      inspectionExpiry: new Date('2025-09-20'),
      isActive: true,
    },
  });

  await prisma.vehicle.upsert({
    where: { organizationId_plateNumber: { organizationId: org.id, plateNumber: '06 XY 789' } },
    update: {},
    create: {
      organizationId: org.id,
      plateNumber: '06 XY 789',
      brand: 'Mercedes',
      model: 'Actros',
      year: 2020,
      type: 'truck',
      status: 'maintenance',
      fuelType: 'diesel',
      currentMileage: 120000,
      nextServiceAt: 125000,
      driverName: 'Ali Kaya',
      insuranceExpiry: new Date('2025-12-01'),
      inspectionExpiry: new Date('2026-01-10'),
      isActive: true,
    },
  });

  // ── Faz 16: Warehouses ────────────────────────────────────────────────────
  const wh1 = await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'DEP-ANA' } },
    update: {},
    create: {
      organizationId: org.id,
      code: 'DEP-ANA',
      name: 'Ana Depo',
      type: 'main',
      address: 'Organize Sanayi Bölgesi, 1. Cadde No:5',
      city: 'İstanbul',
      managerId: adminUser.id,
      isActive: true,
    },
  });

  await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: org.id, code: 'DEP-YEDEK' } },
    update: {},
    create: {
      organizationId: org.id,
      code: 'DEP-YEDEK',
      name: 'Yedek Parça Deposu',
      type: 'satellite',
      address: 'Sanayi Mahallesi, 2. Sokak No:12',
      city: 'İstanbul',
      isActive: true,
    },
  });

  // Add locations to main warehouse
  await prisma.warehouseLocation.upsert({
    where: { warehouseId_code: { warehouseId: wh1.id, code: 'A01' } },
    update: {},
    create: { warehouseId: wh1.id, code: 'A01', name: 'Raf A - Bölüm 1', type: 'shelf', isActive: true },
  });
  await prisma.warehouseLocation.upsert({
    where: { warehouseId_code: { warehouseId: wh1.id, code: 'A02' } },
    update: {},
    create: { warehouseId: wh1.id, code: 'A02', name: 'Raf A - Bölüm 2', type: 'shelf', isActive: true },
  });

  // Add warehouse stock entries
  for (const product of products) {
    await prisma.warehouseStock.upsert({
      where: { warehouseId_productId: { warehouseId: wh1.id, productId: product.id } },
      update: {},
      create: { warehouseId: wh1.id, productId: product.id, quantity: product.currentStock },
    });
  }

  console.log('✅ Seed data başarıyla oluşturuldu!');
  console.log(`   Org: ${org.name} (slug: ${org.slug})`);
  console.log(`   Admin: admin@demo.com / Admin1234!`);
  console.log(`   ${products.length} ürün, ${customers.length} müşteri, ${suppliers.length} tedarikçi, ${employees.length} çalışan`);
  console.log(`   Faz 14: İş merkezleri, BOM, üretim emirleri, KPI tanımları, takvim etkinlikleri`);
  console.log(`   Faz 15: Teklifler, satın alma talepleri, araç filosu eklendi`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
