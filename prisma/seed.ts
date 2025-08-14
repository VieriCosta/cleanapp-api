import { Prisma, PrismaClient, Role, Unit, JobStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = (plain: string) => bcrypt.hashSync(plain, 10);
  const money = (val: string) => new Prisma.Decimal(val);

  // --- Users ---
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cleanapp.local' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@cleanapp.local',
      password: hash('admin123'),
      role: Role.admin,
      phone: '55999990000',
    },
  });

  const customer1 = await prisma.user.upsert({
    where: { email: 'cliente1@cleanapp.local' },
    update: {},
    create: {
      name: 'Cliente 1',
      email: 'cliente1@cleanapp.local',
      password: hash('cliente123'),
      role: Role.customer,
      phone: '5583980000001',
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'cliente2@cleanapp.local' },
    update: {},
    create: {
      name: 'Cliente 2',
      email: 'cliente2@cleanapp.local',
      password: hash('cliente123'),
      role: Role.customer,
      phone: '5583980000002',
    },
  });

  const providerUser1 = await prisma.user.upsert({
    where: { email: 'prestador1@cleanapp.local' },
    update: {},
    create: {
      name: 'Prestador 1',
      email: 'prestador1@cleanapp.local',
      password: hash('prestador123'),
      role: Role.provider,
      phone: '5583980001001',
    },
  });

  const providerUser2 = await prisma.user.upsert({
    where: { email: 'prestador2@cleanapp.local' },
    update: {},
    create: {
      name: 'Prestador 2',
      email: 'prestador2@cleanapp.local',
      password: hash('prestador123'),
      role: Role.provider,
      phone: '5583980001002',
    },
  });

  // --- Addresses (dos clientes) ---
  const addrCustomer1 = await prisma.address.upsert({
    where: { id: 'addr-c1' }, // chave estável só pra evitar duplicar em reruns
    update: {},
    create: {
      id: 'addr-c1',
      userId: customer1.id,
      label: 'Casa',
      street: 'Rua das Flores',
      number: '100',
      district: 'Centro',
      city: 'Pocinhos',
      state: 'PB',
      zip: '58150000',
      lat: new Prisma.Decimal('-7.0760000'),
      lng: new Prisma.Decimal('-36.0660000'),
      isDefault: true,
    },
  });

  const addrCustomer2 = await prisma.address.upsert({
    where: { id: 'addr-c2' },
    update: {},
    create: {
      id: 'addr-c2',
      userId: customer2.id,
      label: 'Ap',
      street: 'Av. Brasil',
      number: '200',
      district: 'Bairro Novo',
      city: 'Campina Grande',
      state: 'PB',
      zip: '58400000',
      lat: new Prisma.Decimal('-7.2300000'),
      lng: new Prisma.Decimal('-35.8800000'),
      isDefault: true,
    },
  });

  // --- Provider Profiles ---
  const prov1 = await prisma.providerProfile.upsert({
    where: { userId: providerUser1.id },
    update: {},
    create: {
      userId: providerUser1.id,
      bio: 'Especialista em limpeza residencial.',
      radiusKm: 12,
      verified: true,
    },
  });

  const prov2 = await prisma.providerProfile.upsert({
    where: { userId: providerUser2.id },
    update: {},
    create: {
      userId: providerUser2.id,
      bio: 'Jardinagem e manutenção de áreas verdes.',
      radiusKm: 20,
      verified: false,
    },
  });

  await prisma.address.upsert({
  where: { id: 'addr-p1' },
  update: {},
  create: {
    id: 'addr-p1',
    userId: providerUser1.id,
    label: 'Base Operacional',
    street: 'Rua do Prestador 1',
    number: '10',
    district: 'Centro',
    city: 'Pocinhos',
    state: 'PB',
    zip: '58150000',
    lat: new Prisma.Decimal('-7.0700000'),
    lng: new Prisma.Decimal('-36.0600000'),
    isDefault: true,
  },
});

await prisma.address.upsert({
  where: { id: 'addr-p2' },
  update: {},
  create: {
    id: 'addr-p2',
    userId: providerUser2.id,
    label: 'Base Operacional',
    street: 'Rua do Prestador 2',
    number: '20',
    district: 'Centro',
    city: 'Campina Grande',
    state: 'PB',
    zip: '58400000',
    lat: new Prisma.Decimal('-7.2305000'),
    lng: new Prisma.Decimal('-35.8795000'),
    isDefault: true,
  },
});

  // --- Categories ---
  const catLimpeza = await prisma.serviceCategory.upsert({
    where: { slug: 'limpeza' },
    update: {},
    create: { name: 'Limpeza', slug: 'limpeza' },
  });

  const catJardinagem = await prisma.serviceCategory.upsert({
    where: { slug: 'jardinagem' },
    update: {},
    create: { name: 'Jardinagem', slug: 'jardinagem' },
  });

  const catAulas = await prisma.serviceCategory.upsert({
    where: { slug: 'aulas' },
    update: {},
    create: { name: 'Aulas', slug: 'aulas' },
  });

  // --- Offers ---
  const offerLimpeza1 = await prisma.serviceOffer.upsert({
    where: { id: 'offer-limpeza-1' },
    update: {},
    create: {
      id: 'offer-limpeza-1',
      providerId: prov1.id,
      categoryId: catLimpeza.id,
      title: 'Faxina completa',
      description: 'Limpeza geral, inclui cozinha e banheiros.',
      priceBase: money('90.00'),
      unit: Unit.hora,
      active: true,
    },
  });

  const offerLimpeza2 = await prisma.serviceOffer.upsert({
    where: { id: 'offer-limpeza-2' },
    update: {},
    create: {
      id: 'offer-limpeza-2',
      providerId: prov1.id,
      categoryId: catLimpeza.id,
      title: 'Diarista',
      description: 'Serviço diário com materiais do cliente.',
      priceBase: money('180.00'),
      unit: Unit.diaria,
      active: true,
    },
  });

  const offerJardinagem = await prisma.serviceOffer.upsert({
    where: { id: 'offer-jardinagem-1' },
    update: {},
    create: {
      id: 'offer-jardinagem-1',
      providerId: prov2.id,
      categoryId: catJardinagem.id,
      title: 'Poda e manutenção',
      description: 'Poda de arbustos, gramado e limpeza do jardim.',
      priceBase: money('200.00'),
      unit: Unit.diaria,
      active: true,
    },
  });

  // --- JOB 1: Pendente com hold ---
  await prisma.job.upsert({
    where: { id: 'job-pending-1' },
    update: {},
    create: {
      id: 'job-pending-1',
      customerId: customer1.id,
      addressId: addrCustomer1.id,
      categoryId: catLimpeza.id,
      offerId: offerLimpeza1.id,
      datetime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: JobStatus.pending,
      priceEstimated: money('180.00'),
      paymentStatus: PaymentStatus.hold,
      notes: 'Apartamento 2 quartos.',
      payments: {
        create: {
          gateway: 'sandbox',
          intentId: 'pi_test_123',
          status: 'requires_capture',
          amount: money('180.00'),
        },
      },
    },
  });

  // --- JOB 2: Concluído (captured) + chat + review ---
  const jobDone = await prisma.job.upsert({
    where: { id: 'job-done-1' },
    update: {},
    create: {
      id: 'job-done-1',
      customerId: customer2.id,
      providerId: providerUser2.id,
      addressId: addrCustomer2.id,
      categoryId: catJardinagem.id,
      offerId: offerJardinagem.id,
      datetime: new Date(Date.now() - 48 * 60 * 60 * 1000),
      status: JobStatus.done,
      priceEstimated: money('200.00'),
      priceFinal: money('220.00'),
      paymentStatus: PaymentStatus.captured,
      notes: 'Casa com quintal grande.',
      payments: {
        create: {
          gateway: 'sandbox',
          intentId: 'pi_test_456',
          chargeId: 'ch_test_456',
          status: 'succeeded',
          amount: money('220.00'),
          fees: money('10.00'),
          receiptUrl: 'https://example.com/receipt/456',
        },
      },
      conversation: { create: {} },
    },
    include: { conversation: true },
  });

  if (jobDone.conversation) {
    await prisma.message.createMany({
      data: [
        { conversationId: jobDone.conversation.id, senderId: customer2.id,  content: 'Olá! Pode vir às 8h?' },
        { conversationId: jobDone.conversation.id, senderId: providerUser2.id, content: 'Posso sim, chego no horário.' },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.review.upsert({
    where: { jobId: 'job-done-1' },
    update: { rating: 5, comment: 'Serviço excelente, muito atencioso!' },
    create: {
      jobId: 'job-done-1',
      raterId: customer2.id,
      rateeId: providerUser2.id,
      rating: 5,
      comment: 'Serviço excelente, muito atencioso!',
    },
  });

  // Atualiza score do prestador 2
  const reviewsProv2 = await prisma.review.findMany({ where: { rateeId: providerUser2.id } });
  const avg = reviewsProv2.reduce((acc, r) => acc + r.rating, 0) / (reviewsProv2.length || 1);
  await prisma.providerProfile.update({
    where: { id: prov2.id },
    data: { scoreAvg: avg, totalReviews: reviewsProv2.length },
  });

  console.log('✅ Seed completo concluído.');
}

main()
  .catch((e) => {
    console.error('❌ Seed falhou:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
