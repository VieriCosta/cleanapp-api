import request from 'supertest';
import { buildApp } from '../../src/app';
import { prisma } from '../../src/db/client';
import { addMinutes } from 'date-fns';

const app = buildApp();

async function login(email: string, password: string) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  expect(res.status).toBe(200);
  return { token: res.body.accessToken as string, user: res.body.user };
}

describe('Jobs - fluxo de pagamento MOCK', () => {
  let customer: { token: string; user: any };
  let provider: { token: string; user: any };
  let addressId: string;
  let offerId: string;
  let jobId: string;

  beforeAll(async () => {
  customer = await login('cliente1@cleanapp.local', 'cliente123');
  provider = await login('prestador1@cleanapp.local', 'prestador123');

  // endereço default do cliente
  const addr = await prisma.address.findFirst({
    where: { userId: customer.user.id, isDefault: true },
  });
  expect(addr).toBeTruthy();
  addressId = addr!.id;

  // tenta achar uma categoria (ou cria uma genérica)
  let cat = await prisma.serviceCategory.findFirst();
  if (!cat) {
    cat = await prisma.serviceCategory.create({
      data: { name: 'Geral', slug: 'geral' },
    });
  }

  // tenta achar oferta ativa do prestador (pelo relacionamento provider.userId)
  let off = await prisma.serviceOffer.findFirst({
    where: { active: true, provider: { userId: provider.user.id } },
  });

  // se não achar, cria via API (garante compatibilidade com seu schema)
  if (!off) {
    const created = await request(app)
      .post('/api/offers')
      .set('Authorization', `Bearer ${provider.token}`)
      .send({
        title: 'Oferta Teste (auto)',
        description: 'Criada automaticamente pelo teste',
        priceBase: 150,
        unit: 'diaria',
        categorySlug: cat.slug,   // usa a categoria existente
        active: true,
      });

    expect(created.status).toBe(201);
    expect(created.body?.offer?.id).toBeTruthy();

    // recarrega pelo Prisma para garantir consistência nos próximos passos
    off = await prisma.serviceOffer.findUnique({
      where: { id: created.body.offer.id },
    });
  }

  expect(off).toBeTruthy();
  offerId = off!.id;
});

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('cria job (paymentStatus = hold)', async () => {
    const datetime = addMinutes(new Date(), 60).toISOString();
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ offerId, addressId, datetime, notes: 'Teste de job' });

    expect(res.status).toBe(201);
    expect(res.body.job).toBeTruthy();
    expect(res.body.job.paymentStatus).toBe('hold');

    jobId = res.body.job.id;
  });

  it('provider aceita e inicia o job', async () => {
    const acc = await request(app)
      .post(`/api/jobs/${jobId}/accept`)
      .set('Authorization', `Bearer ${provider.token}`)
      .send();
    expect(acc.status).toBe(200);
    expect(acc.body.job.status).toBe('accepted');

    const start = await request(app)
      .post(`/api/jobs/${jobId}/start`)
      .set('Authorization', `Bearer ${provider.token}`)
      .send();
    expect(start.status).toBe(200);
    expect(start.body.job.status).toBe('in_progress');
  });

  it('finaliza o job (paymentStatus = captured)', async () => {
    const fin = await request(app)
      .post(`/api/jobs/${jobId}/finish`)
      .set('Authorization', `Bearer ${provider.token}`)
      .send();
    expect(fin.status).toBe(200);
    expect(fin.body.job.status).toBe('done');

    const refreshed = await prisma.job.findUnique({ where: { id: jobId } });
    expect(refreshed?.paymentStatus).toBe('captured');
  });

  it('cancela outro job pendente (paymentStatus = refunded)', async () => {
    const datetime = addMinutes(new Date(), 120).toISOString();
    const create = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ offerId, addressId, datetime });

    expect(create.status).toBe(201);
    const jid = create.body.job.id as string;

    const cancel = await request(app)
      .post(`/api/jobs/${jid}/cancel`)
      .set('Authorization', `Bearer ${customer.token}`)
      .send({ reason: 'Teste de cancelamento' });

    expect(cancel.status).toBe(200);
    const job = await prisma.job.findUnique({ where: { id: jid } });
    expect(job?.status).toBe('canceled');
    expect(job?.paymentStatus).toBe('refunded');
  });
});
