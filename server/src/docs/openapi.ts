/**
 * OpenAPI 3.0 specification for the REST API (base path `/api`).
 * Kept in sync with routes and validators under `src/routes` and `src/validators`.
 */

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "E-commerce API",
    version: "1.0.0",
    description:
      "REST API for the e-commerce app. JSON bodies use `Content-Type: application/json`. " +
      "Successful responses follow `{ success: true, message: string, data?: unknown }`; " +
      "errors use `{ success: false, message: string, errors?: Record<string, string[]> }`. " +
      "Authentication uses httpOnly cookies `access_token` (JWT) and `refresh_token`. " +
      "Send cookies from the same origin (e.g. `credentials: 'include'` in fetch). " +
      "List `limit` query params are capped at 50.",
  },
  servers: [{ url: "/api", description: "API base (same host as the server)" }],
  tags: [
    { name: "Auth", description: "Registration, login, session" },
    { name: "Products", description: "Public product catalog" },
    { name: "Categories", description: "Product categories" },
    { name: "Cart", description: "Customer cart (CUSTOMER role)" },
    { name: "Orders", description: "Customer orders (CUSTOMER role)" },
    { name: "Admin — Products", description: "Product management (ADMIN role)" },
    { name: "Admin — Orders", description: "Order management (ADMIN role)" },
  ],
  components: {
    securitySchemes: {
      accessTokenCookie: {
        type: "apiKey",
        in: "cookie",
        name: "access_token",
        description: "JWT access token (httpOnly)",
      },
      refreshTokenCookie: {
        type: "apiKey",
        in: "cookie",
        name: "refresh_token",
        description: "JWT refresh token (httpOnly); used by POST /auth/refresh",
      },
    },
    schemas: {
      ApiSuccess: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: { description: "Response payload" },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          errors: {
            type: "object",
            additionalProperties: { type: "array", items: { type: "string" } },
          },
        },
      },
      RegisterBody: {
        type: "object",
        required: ["email", "password", "name"],
        properties: {
          email: { type: "string", format: "email" },
          password: {
            type: "string",
            description:
              "At least 6 characters with uppercase, lowercase, a digit, and a special character",
          },
          name: { type: "string", minLength: 2 },
        },
      },
      LoginBody: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      UserPublic: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          email: { type: "string" },
          role: { type: "string", enum: ["ADMIN", "CUSTOMER"] },
        },
      },
      CreateProductBody: {
        type: "object",
        required: ["name", "price", "stock", "categoryId"],
        properties: {
          name: { type: "string", maxLength: 255 },
          description: { type: "string" },
          price: { type: "number", exclusiveMinimum: 0 },
          stock: { type: "integer", minimum: 0 },
          categoryId: { type: "integer", minimum: 1 },
          imageUrl: { type: "string", format: "uri" },
        },
      },
      UpdateProductBody: {
        type: "object",
        properties: {
          name: { type: "string", maxLength: 255 },
          description: { type: "string" },
          price: { type: "number", exclusiveMinimum: 0 },
          stock: { type: "integer", minimum: 0 },
          categoryId: { type: "integer", minimum: 1 },
          imageUrl: { type: "string", format: "uri" },
        },
      },
      AddCartItemBody: {
        type: "object",
        required: ["productId", "quantity"],
        properties: {
          productId: { type: "number", exclusiveMinimum: 0 },
          quantity: { type: "integer", minimum: 1 },
        },
      },
      UpdateCartItemBody: {
        type: "object",
        required: ["quantity"],
        properties: {
          quantity: { type: "integer", minimum: 1 },
        },
      },
      AdminOrderStatusBody: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["PENDING", "CONFIRMED", "CANCELLED"],
          },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/RegisterBody" } },
          },
        },
        responses: {
          "201": {
            description: "User created; auth cookies set",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } },
          },
          "400": { description: "Validation or conflict", content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/LoginBody" } },
          },
        },
        responses: {
          "200": {
            description: "Success; auth cookies set",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } },
          },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        description: "Uses `refresh_token` cookie",
        security: [{ refreshTokenCookie: [] }],
        responses: {
          "200": { description: "New tokens; cookies updated" },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user",
        security: [{ accessTokenCookie: [] }],
        responses: {
          "200": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } },
          },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        description: "Clears auth cookies",
        responses: {
          "200": { description: "Logged out" },
        },
      },
    },
    "/products": {
      get: {
        tags: ["Products"],
        summary: "List products",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50 } },
          { name: "categoryId", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
        },
      },
    },
    "/products/{id}": {
      get: {
        tags: ["Products"],
        summary: "Get product by id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "404": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/categories": {
      get: {
        tags: ["Categories"],
        summary: "List categories",
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
        },
      },
    },
    "/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get cart",
        security: [{ accessTokenCookie: [] }],
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/cart/items": {
      post: {
        tags: ["Cart"],
        summary: "Add item to cart",
        security: [{ accessTokenCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/AddCartItemBody" } },
          },
        },
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/cart/items/{itemId}": {
      patch: {
        tags: ["Cart"],
        summary: "Update cart line quantity",
        security: [{ accessTokenCookie: [] }],
        parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateCartItemBody" } },
          },
        },
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
      delete: {
        tags: ["Cart"],
        summary: "Remove cart line",
        security: [{ accessTokenCookie: [] }],
        parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/orders": {
      post: {
        tags: ["Orders"],
        summary: "Place order from cart",
        security: [{ accessTokenCookie: [] }],
        responses: {
          "201": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
      get: {
        tags: ["Orders"],
        summary: "List my orders",
        security: [{ accessTokenCookie: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50 } },
        ],
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/orders/{id}": {
      get: {
        tags: ["Orders"],
        summary: "Get order by id",
        security: [{ accessTokenCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/orders/{id}/cancel": {
      patch: {
        tags: ["Orders"],
        summary: "Cancel order",
        security: [{ accessTokenCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/admin/products": {
      post: {
        tags: ["Admin — Products"],
        summary: "Create product",
        security: [{ accessTokenCookie: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateProductBody" } },
          },
        },
        responses: {
          "201": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/admin/products/{id}": {
      put: {
        tags: ["Admin — Products"],
        summary: "Update product",
        security: [{ accessTokenCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/UpdateProductBody" } },
          },
        },
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
      delete: {
        tags: ["Admin — Products"],
        summary: "Delete product",
        security: [{ accessTokenCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/admin/orders": {
      get: {
        tags: ["Admin — Orders"],
        summary: "List orders (admin)",
        security: [{ accessTokenCookie: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50 } },
          { name: "categoryId", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
    "/admin/orders/{id}/status": {
      patch: {
        tags: ["Admin — Orders"],
        summary: "Update order status",
        security: [{ accessTokenCookie: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/AdminOrderStatusBody" } },
          },
        },
        responses: {
          "200": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiSuccess" } } } },
          "401": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "403": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
          "404": { content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } } },
        },
      },
    },
  },
} as const;
