import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "./openapi";

export function setupSwagger(app: Express): void {
  app.get("/api-docs.json", (_req, res) => {
    res.json(openapiSpec);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      customSiteTitle: "E-commerce API",
      swaggerOptions: {
        persistAuthorization: true,
      },
    }),
  );
}
