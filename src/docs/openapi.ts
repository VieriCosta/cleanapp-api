// src/docs/openapi.ts
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CleanApp API',
    version: '1.0.0',
    description:
      'API para plataforma de serviços sob demanda (clientes x prestadores). Endpoints protegidos usam Bearer JWT.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local' }],
  tags: [
    { name: 'Health' }, { name: 'Auth' }, { name: 'Users' },
    { name: 'Categories' }, { name: 'Offers' }, { name: 'Addresses' },
    { name: 'Jobs' }, { name: 'Conversations' }, { name: 'Reviews' }
  ],
  components: {
    securitySchemes: {
      BearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: { error: { type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'string' },
            correlationId: { type: 'string' },
          } } },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, email: { type: 'string' },
          role: { type: 'string', enum: ['admin','customer','provider'] },
          phone: { type: 'string', nullable: true }, photoUrl: { type: 'string', nullable: true },
        },
      },
      Address: {
        type: 'object',
        properties: {
          id: { type: 'string' }, userId: { type: 'string' },
          label: { type: 'string', nullable: true }, street: { type: 'string' }, number: { type: 'string', nullable: true },
          district: { type: 'string', nullable: true }, city: { type: 'string' }, state: { type: 'string' }, zip: { type: 'string' },
          lat: { type: 'number', nullable: true }, lng: { type: 'number', nullable: true }, isDefault: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' }
        },
      },
      ServiceCategory: {
        type: 'object',
        properties: {
          id: { type: 'string' }, name: { type: 'string' }, slug: { type: 'string' },
          active: { type: 'boolean' },
        },
      },
      ServiceOffer: {
        type: 'object',
        properties: {
          id: { type: 'string' }, providerId: { type: 'string' }, categoryId: { type: 'string' },
          title: { type: 'string' }, description: { type: 'string' },
          priceBase: { type: 'number' }, unit: { type: 'string' },
          active: { type: 'boolean' },
        },
      },
      Job: {
        type: 'object',
        properties: {
          id: { type: 'string' }, customerId: { type: 'string' }, providerId: { type: 'string', nullable: true },
          addressId: { type: 'string' }, categoryId: { type: 'string' }, offerId: { type: 'string' },
          datetime: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['pending','accepted','in_progress','done','canceled'] },
          paymentStatus: { type: 'string', enum: ['hold','captured','refunded','failed'] },
          priceEstimated: { type: 'number' }, priceFinal: { type: 'number', nullable: true },
          notes: { type: 'string', nullable: true },
        },
      },
      Conversation: {
        type: 'object',
        properties: {
          id: { type: 'string' }, jobId: { type: 'string' },
          job: { $ref: '#/components/schemas/Job' },
        },
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'string' }, conversationId: { type: 'string' },
          senderId: { type: 'string' }, content: { type: 'string' },
          read: { type: 'boolean' }, createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Review: {
        type: 'object',
        properties: {
          id: { type: 'string' }, jobId: { type: 'string' },
          raterId: { type: 'string' }, rateeId: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      // Wrappers de listagem
      PaginatedOffers: {
        type: 'object',
        properties: {
          total: { type: 'integer' }, page: { type: 'integer' }, pageSize: { type: 'integer' },
          items: { type: 'array', items: { $ref: '#/components/schemas/ServiceOffer' } },
        },
      },
      PaginatedJobs: {
        type: 'object',
        properties: {
          total: { type: 'integer' }, page: { type: 'integer' }, pageSize: { type: 'integer' },
          items: { type: 'array', items: { $ref: '#/components/schemas/Job' } },
        },
      },
      PaginatedConversations: {
        type: 'object',
        properties: {
          total: { type: 'integer' }, page: { type: 'integer' }, pageSize: { type: 'integer' },
          items: { type: 'array', items: { $ref: '#/components/schemas/Conversation' } },
        },
      },
      AuthTokens: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
    },
  },
  paths: {
    // HEALTH
    '/api/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Liveness',
        responses: { '200': { description: 'ok' } },
      },
    },
    '/api/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Readiness (DB ping)',
        responses: { '200': { description: 'ready' }, '500': { description: 'not_ready' } },
      },
    },

    // AUTH
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar usuário',
        requestBody: {
          required: true,
          content: { 'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string' }, password: { type: 'string' },
                role: { type: 'string', enum: ['customer','provider'] },
              },
              required: ['name','email','password']
            } } },
        },
        responses: { '201': { description: 'Criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } } },
                     '409': { description: 'Email em uso', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } } }
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'], summary: 'Login',
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } }, required: ['email','password']
        } } } },
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthTokens' } } } },
                     '401': { description: 'Credenciais inválidas' } }
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'], summary: 'Refresh token',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } }, required: ['refreshToken'] } } } },
        responses: { '200': { description: 'OK' } }
      },
    },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Logout (stateless)', responses: { '204': { description: 'No Content' } } } },

    // USERS
    '/api/users/me': {
      get: {
        tags: ['Users'], summary: 'Dados do usuário logado',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } } } } },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/api/users/{id}/reviews': {
      get: {
        tags: ['Reviews'], summary: 'Avaliações recebidas por um usuário (prestador)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } },
                     { name: 'page', in: 'query', schema: { type: 'integer' } },
                     { name: 'pageSize', in: 'query', schema: { type: 'integer' } }],
        responses: { '200': { description: 'OK' } },
      },
    },

    // CATEGORIES
    '/api/categories': {
      get: {
        tags: ['Categories'], summary: 'Listar categorias ativas (público)',
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/ServiceCategory' } } } } } } },
      } },
      post: {
        tags: ['Categories'], summary: 'Criar categoria (admin)',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ServiceCategory' } } } },
        responses: { '201': { description: 'Criado' }, '409': { description: 'Conflito' } },
      },
    },
    '/api/categories/{id}': {
      get: {
        tags: ['Categories'], summary: 'Detalhar categoria (público)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Não encontrada' } },
      },
      put: {
        tags: ['Categories'], summary: 'Atualizar categoria (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ServiceCategory' } } } },
        responses: { '200': { description: 'OK' } },
      },
      delete: {
        tags: ['Categories'], summary: 'Remover categoria (admin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'No Content' }, '400': { description: 'Em uso' } },
      },
    },

    // OFFERS
    '/api/offers': {
      get: {
        tags: ['Offers'], summary: 'Listar ofertas (filtros: category, near, radius, paginação)',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'near', in: 'query', schema: { type: 'string' }, description: 'lat,lng' },
          { name: 'radius', in: 'query', schema: { type: 'number' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedOffers' } } } } },
      },
      post: {
        tags: ['Offers'], summary: 'Criar oferta (provider)',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ServiceOffer' } } } },
        responses: { '201': { description: 'Criado' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/offers/{id}': {
      get: {
        tags: ['Offers'], summary: 'Detalhar oferta (público)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Não encontrada' } },
      },
      put: {
        tags: ['Offers'], summary: 'Atualizar oferta (provider dono)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ServiceOffer' } } } },
        responses: { '200': { description: 'OK' }, '403': { description: 'Forbidden' } },
      },
      delete: {
        tags: ['Offers'], summary: 'Excluir oferta (provider dono)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'No Content' }, '400': { description: 'Em uso' } },
      },
    },

    // ADDRESSES (me)
    '/api/me/addresses': {
      get: {
        tags: ['Addresses'], summary: 'Listar endereços do usuário logado',
        security: [{ BearerAuth: [] }],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: {
          type: 'object', properties: { items: { type: 'array', items: { $ref: '#/components/schemas/Address' } } }
        } } } } },
      },
      post: {
        tags: ['Addresses'], summary: 'Criar endereço do usuário logado',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Address' } } } },
        responses: { '201': { description: 'Criado' } },
      },
    },
    '/api/me/addresses/{id}/default': {
      patch: {
        tags: ['Addresses'], summary: 'Definir endereço como padrão',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Não encontrado' } },
      },
    },
    '/api/me/addresses/{id}': {
      delete: {
        tags: ['Addresses'], summary: 'Excluir endereço do usuário',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '204': { description: 'No Content' }, '400': { description: 'Em uso' } },
      },
    },

    // JOBS
    '/api/jobs': {
      post: {
        tags: ['Jobs'], summary: 'Criar job (cliente)',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object',
          properties: {
            offerId: { type: 'string' }, addressId: { type: 'string' },
            datetime: { type: 'string', format: 'date-time' }, notes: { type: 'string' },
          },
          required: ['offerId','addressId','datetime']
        } } } },
        responses: { '201': { description: 'Criado' }, '400': { description: 'Oferta inválida' } },
      },
      get: {
        tags: ['Jobs'], summary: 'Listar jobs (por papel/status)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'role', in: 'query', required: true, schema: { type: 'string', enum: ['customer','provider'] } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedJobs' } } } } },
      },
    },
    '/api/jobs/{id}/accept': {
      post: { tags: ['Jobs'], summary: 'Aceitar (provider)', security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' }, '400': { description: 'Estado inválido' } } },
    },
    '/api/jobs/{id}/start':  { post: { tags: ['Jobs'], summary: 'Iniciar (provider)',  security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } } },
    '/api/jobs/{id}/finish': { post: { tags: ['Jobs'], summary: 'Finalizar (provider)', security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } } },
    '/api/jobs/{id}/cancel': { post: { tags: ['Jobs'], summary: 'Cancelar (cliente ou provider)', security: [{ BearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'OK' } } } },
    '/api/jobs/{id}/review': {
      post: {
        tags: ['Reviews'], summary: 'Avaliar prestador após job done (cliente)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: {
          type: 'object', properties: { rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string' } },
          required: ['rating']
        } } } },
        responses: { '201': { description: 'Criado/Atualizado' } },
      },
    },

    // CONVERSATIONS
    '/api/conversations': {
      get: {
        tags: ['Conversations'], summary: 'Listar conversas do usuário',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedConversations' } } } } },
      },
    },
    '/api/conversations/{id}': {
      get: {
        tags: ['Conversations'], summary: 'Detalhar conversa',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' }, '404': { description: 'Não encontrada' } },
      },
    },
    '/api/conversations/{id}/messages': {
      get: {
        tags: ['Conversations'], summary: 'Listar mensagens (marca lidas)',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'OK' } },
      },
      post: {
        tags: ['Conversations'], summary: 'Enviar mensagem',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { content: { type: 'string' } }, required: ['content'] } } } },
        responses: { '201': { description: 'Criado' } },
      },
    },
    '/api/conversations/{id}/read': {
      post: {
        tags: ['Conversations'], summary: 'Marcar todas como lidas',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OK' } },
      },
    },
  },
} as const;