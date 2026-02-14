import express, { Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 8081;

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://user-service:3000";
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "http://product-management:8000";
const CART_SERVICE_URL = process.env.CART_SERVICE_URL || "http://cart-service:8001";

app.get("/swagger-json", async (_req: Request, res: Response) => {
    try {
        const [userSpec, productSpec, cartSpec] = await Promise.all([
            axios.get(`${USER_SERVICE_URL}/swagger.json`).then(r => r.data).catch(() => null),
            axios.get(`${PRODUCT_SERVICE_URL}/swagger.json`).then(r => r.data).catch(() => null),
            axios.get(`${CART_SERVICE_URL}/swagger.json`).then(r => r.data).catch(() => null)
        ]);

        const mergedSpec: any = {
            openapi: "3.0.0",
            info: {
                title: "Ecommerce Project - Unified API Documentation",
                version: "1.0.0",
                description: "Combined documentation for all public services (Nginx Gateway)"
            },
            servers: [{ url: "/" }],
            paths: {},
            components: { schemas: {}, securitySchemes: {} }
        };

        const specs = [userSpec, productSpec, cartSpec];
        specs.forEach(spec => {
            if (spec) {
                Object.assign(mergedSpec.paths, spec.paths);
                if (spec.components?.schemas) Object.assign(mergedSpec.components.schemas, spec.components.schemas);
                if (spec.components?.securitySchemes) Object.assign(mergedSpec.components.securitySchemes, spec.components.securitySchemes);
            }
        });

        res.json(mergedSpec);
    } catch (error) {
        res.status(500).json({ error: "Failed to merge documentation" });
    }
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(undefined, {
    swaggerOptions: { url: "/swagger-json" }
}));

app.listen(PORT, () => {
    console.log(`Docs Service running on port ${PORT}`);
});
