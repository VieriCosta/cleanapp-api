🧹 CleanApp API

API do CleanApp, uma plataforma de serviços sob demanda estilo “iFood de serviços”, onde clientes podem contratar prestadores para tarefas como limpeza, jardinagem, aulas e muito mais.

🚀 Tecnologias utilizadas

Node.js + Express — Backend
TypeScript — Tipagem estática
Prisma ORM — Conexão com banco de dados
MySQL — Banco de dados relacional
JWT — Autenticação
Bcrypt — Criptografia de senhas
Socket.IO — Comunicação em tempo real
Pino — Logs

📂 Estrutura do projeto
src/
 ├── routes/        # Rotas da aplicação
 ├── controllers/   # Controladores (lógica das rotas)
 ├── services/      # Serviços (regras de negócio)
 ├── lib/           # Configurações auxiliares
 ├── index.ts       # Ponto de entrada da API
prisma/
 ├── schema.prisma  # Definição das tabelas e modelos
 ├── seed.ts        # População inicial do banco

⚙️ Pré-requisitos

Node.js 20+
MySQL instalado e configurado
NPM ou Yarn para instalar dependências

📦 Instalação
# Clonar o repositório
git clone https://github.com/VieriCosta/cleanapp-api.git

# Entrar na pasta
cd cleanapp-api

# Instalar dependências
npm install

🔧 Configuração

Duplique o arquivo .env.example e renomeie para .env.

Preencha as variáveis de ambiente com suas configurações de banco e JWT.

Exemplo:

DATABASE_URL="mysql://user:password@localhost:3306/cleanapp"
JWT_SECRET="sua_chave_secreta"
PORT=3000

🗄️ Banco de dados

Rodar as migrações:
npx prisma migrate dev

Popular o banco com dados iniciais:
npm run db:seed
▶️ Rodando o projeto
npm run dev
A API ficará disponível em:
http://localhost:3000
📌 Rotas iniciais

GET /api/health/live → Testar se a API está rodando
POST /api/auth/register → Registrar um novo usuário
POST /api/auth/login → Fazer login e receber token JWT

📄 Licença: Este projeto está sob licença MIT.