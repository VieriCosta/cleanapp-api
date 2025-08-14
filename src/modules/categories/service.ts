import { prisma } from '../../db/client';
import { slugify } from '../../lib/slug';

export async function listActive() {
  return prisma.serviceCategory.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });
}

export async function listAll() {
  return prisma.serviceCategory.findMany({
    orderBy: [{ active: 'desc' }, { name: 'asc' }],
  });
}

export async function detail(id: string) {
  const cat = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!cat) throw { status: 404, code: 'CATEGORY_NOT_FOUND' };
  return cat;
}

export async function create(params: { name: string; slug?: string; active?: boolean }) {
  const slug = (params.slug && params.slug.trim())
    ? params.slug.trim().toLowerCase()
    : slugify(params.name);

  const exists = await prisma.serviceCategory.findFirst({ where: { OR: [{ slug }, { name: params.name }] } });
  if (exists) throw { status: 409, code: 'CATEGORY_EXISTS', message: 'Nome ou slug já em uso' };

  return prisma.serviceCategory.create({
    data: { name: params.name, slug, active: params.active ?? true },
  });
}

export async function update(id: string, params: { name?: string; slug?: string; active?: boolean }) {
  const current = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!current) throw { status: 404, code: 'CATEGORY_NOT_FOUND' };

  let nextSlug = current.slug;
  if (typeof params.slug === 'string') {
    nextSlug = params.slug.trim() ? params.slug.toLowerCase().trim() : slugify(params.name ?? current.name);
  } else if (typeof params.name === 'string') {
    // se apenas nome mudar, recalcula slug só se quiser esse comportamento; manteremos slug existente
    nextSlug = current.slug;
  }

  if (nextSlug !== current.slug) {
    const dupe = await prisma.serviceCategory.findFirst({ where: { slug: nextSlug, id: { not: id } } });
    if (dupe) throw { status: 409, code: 'SLUG_IN_USE' };
  }

  return prisma.serviceCategory.update({
    where: { id },
    data: {
      name: params.name ?? current.name,
      slug: nextSlug,
      active: typeof params.active === 'boolean' ? params.active : current.active,
    },
  });
}

export async function remove(id: string) {
  const cat = await prisma.serviceCategory.findUnique({ where: { id } });
  if (!cat) throw { status: 404, code: 'CATEGORY_NOT_FOUND' };

  const offers = await prisma.serviceOffer.count({ where: { categoryId: id } });
  const jobs   = await prisma.job.count({ where: { categoryId: id } });

  if (offers > 0 || jobs > 0) {
    // Por segurança no MVP: não deletar se em uso.
    throw { status: 400, code: 'CATEGORY_IN_USE', message: 'Categoria em uso. Desative (active=false) em vez de deletar.' };
  }

  await prisma.serviceCategory.delete({ where: { id } });
  return { deleted: true };
}
