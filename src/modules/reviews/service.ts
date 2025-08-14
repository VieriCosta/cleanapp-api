import { prisma } from '../../db/client';
import { JobStatus } from '@prisma/client';

export async function createOrUpdateForJob(params: {
  jobId: string;
  customerId: string;
  rating: number;
  comment?: string;
}) {
  const { jobId, customerId, rating, comment } = params;

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      customerId: true,
      providerId: true,
    },
  });

  if (!job) throw { status: 404, code: 'JOB_NOT_FOUND' };
  if (job.status !== JobStatus.done)
    throw { status: 400, code: 'JOB_NOT_DONE', message: 'Só é possível avaliar jobs concluídos.' };
  if (job.customerId !== customerId)
    throw { status: 403, code: 'FORBIDDEN', message: 'Apenas o cliente pode avaliar.' };
  if (!job.providerId)
    throw { status: 400, code: 'JOB_WITHOUT_PROVIDER', message: 'Job não possui prestador.' };

  // upsert por jobId único (1 review por job)
  const review = await prisma.review.upsert({
    where: { jobId },
    update: { rating, comment },
    create: {
      jobId,
      raterId: customerId,
      rateeId: job.providerId,
      rating,
      comment,
    },
  });

  // recalcular métricas do ProviderProfile do prestador
  const agg = await prisma.review.aggregate({
    where: { rateeId: job.providerId },
    _avg: { rating: true },
    _count: { _all: true },
  });

  // providerId é userId do prestador; perfil é por userId
  const providerProfile = await prisma.providerProfile.findUnique({
    where: { userId: job.providerId },
    select: { id: true },
  });

  if (providerProfile) {
    await prisma.providerProfile.update({
      where: { id: providerProfile.id },
      data: {
        scoreAvg: Number(agg._avg.rating ?? 0),
        totalReviews: agg._count._all,
      },
    });
  }

  return review;
}

export async function listForUser(params: {
  userId: string;      // rateeId = quem recebeu a avaliação (prestador)
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const take = Math.min(50, Math.max(1, params.pageSize ?? 10));
  const skip = (page - 1) * take;

  const where = { rateeId: params.userId };
  const [total, items, agg] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        job: {
          select: {
            id: true,
            datetime: true,
            category: { select: { id: true, name: true, slug: true } },
            customer: { select: { id: true, name: true } },
          },
        },
        rater: { select: { id: true, name: true } },
      },
    }),
    prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  return {
    total,
    page,
    pageSize: take,
    summary: {
      average: Number(agg._avg.rating ?? 0),
      count: agg._count._all,
    },
    items,
  };
}
