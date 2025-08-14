# CleanApp API (MVP)

Plataforma de serviços sob demanda (tipo “iFood de serviços”) — **API** em Node.js + Express + Prisma + MySQL.  
Este repositório contém o backend do MVP, com autenticação JWT, catálogo (categorias e ofertas), endereços, jobs (criar/aceitar/iniciar/finalizar/cancelar), conversas e testes de integração.

> **Docs da API:** abra `http://localhost:3000/api/docs` (Swagger UI)

---

## Stack

- **Runtime:** Node.js 22
- **Framework:** Express 5
- **ORM:** Prisma (MySQL)
- **Auth:** JWT (access/refresh)
- **Logs:** pino
- **Realtime:** Socket.IO
- **Validação:** zod
- **Tests:** Jest + Supertest + ts-jest
- **Tipos/Build:** TypeScript + tsx

---

## Getting Started

### Requisitos
- Node.js 18+ (recomendado 22)
- MySQL rodando localmente (crie um DB p/ o projeto)

### Configuração

1. Copie o `.env.example` para `.env` e ajuste:
   ```env
   # App
   NODE_ENV=development
   PORT=3000
   LOG_LEVEL=info

   # DB
   DATABASE_URL="mysql://cleanapp:cleanapp@localhost:3306/cleanapp"

   # JWT
   JWT_ACCESS_SECRET=... # 64 hex
   JWT_REFRESH_SECRET=... # 64 hex
   JWT_ACCESS_EXPIRES=15m
   JWT_REFRESH_EXPIRES=7d
2. Instale as dependências:

bash
Copiar
Editar
npm install
3. Migrações e client do Prisma:

bash
Copiar
Editar
npx prisma migrate dev --name init
npx prisma generate

4. Seed de dados (usuários, perfis, categorias, ofertas, endereços):

bash
Copiar
Editar
npm run db:seed

5. Subir a API:

bash
Copiar
Editar
npm run dev
Logs esperados:

yaml
Copiar
Editar
INFO: Socket.IO initialized
INFO: HTTP server started port: 3000

6. Abra a documentação:

http://localhost:3000/api/docs

Scripts úteis
json
Copiar
Editar
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "db:seed": "tsx prisma/seed.ts",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:integration": "jest tests/integration --runInBand"
}
Endpoints principais (MVP)
Auth

POST /api/auth/register — registrar (name, email, password, role)

POST /api/auth/login — login → accessToken, refreshToken

POST /api/auth/refresh — renovar accessToken

Categorias e Ofertas

GET /api/categories — lista categorias

GET /api/offers — lista ofertas (filtros por categoria)

POST /api/offers — (prestador) cria oferta

Endereços do usuário

GET /api/me/addresses — meus endereços

POST /api/me/addresses — cria

POST /api/me/addresses/:id/default — define como padrão

DELETE /api/me/addresses/:id — remove (valida se não está em job ativo)

Jobs

POST /api/jobs — (cliente) cria job
body: { offerId, addressId, datetime, notes? }
→ cria Job com status=pending, paymentStatus=hold (mock)

GET /api/jobs?role=customer|provider&status=... — lista com filtros (datas, categoria, ordenação, paginação)

POST /api/jobs/:id/accept — (prestador) aceita (accepted)

POST /api/jobs/:id/start — (prestador) inicia (in_progress)

POST /api/jobs/:id/finish — (prestador) finaliza (done + paymentStatus=captured)

POST /api/jobs/:id/cancel — (cliente ou prestador) cancela (canceled + paymentStatus=refunded)

Conversas & Mensagens

GET /api/conversations — minhas conversas (por job)

GET /api/conversations/:id/messages — mensagens

POST /api/conversations/:id/messages — envia mensagem

POST /api/conversations/:id/read-all — marca todas como lidas

Saúde

GET /api/health/live / ready

Veja payloads e schemas detalhados no Swagger.

Testes
Testes de integração (usam o app em memória via Supertest):

bash
Copiar
Editar
npm run test:integration
O teste principal simula o fluxo de pagamento mock via transições:

cliente cria job → paymentStatus=hold

prestador aceita e inicia → accepted → in_progress

prestador finaliza → done + paymentStatus=captured

cria outro job e cancela → canceled + paymentStatus=refunded

Por padrão, os testes usam o mesmo DB da .env. Se quiser um banco de testes, configure NODE_ENV=test e DATABASE_URL separados e adapte o Jest.

Estrutura do projeto
pgsql
Copiar
Editar
src/
  app.ts
  index.ts
  routes/
    index.ts
  middlewares/
  lib/
  db/
    client.ts
  docs/
    openapi.ts
  realtime/
    socket.ts
  modules/
    auth/
      routes.ts controller.ts service.ts tokens.ts
    users/
    categories/
    offers/
    addresses/
    jobs/
      routes.ts controller.ts service.ts
    conversations/
      routes.ts controller.ts service.ts
tests/
  integration/
    jobs.payment-mock.spec.ts
prisma/
  schema.prisma
  seed.ts