import express from "express";
import "reflect-metadata";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import { AppDataSource } from "../infrastructure/database/data_source.js";
import { RabbitMQService } from "../infrastructure/messaging/rabbitmq_service.js";
import { TypeORMProductRepository } from "../infrastructure/database/repositories/product_repository.js";
import { TypeORMCategoryRepository } from "../infrastructure/database/repositories/category_repository.js";
import { TypeORMInventoryRepository } from "../infrastructure/database/repositories/inventory_repository.js";
import { ProductUseCases } from "../application/usecases/product_usecases.js";
import { CategoryUseCases } from "../application/usecases/category_usecases.js";
import { InventoryUseCases } from "../application/usecases/inventory_usecases.js";
import { ProductController } from "../infrastructure/web/controllers/product_controller.js";
import { CategoryController } from "../infrastructure/web/controllers/category_controller.js";
import { InventoryController } from "../infrastructure/web/controllers/inventory_controller.js";
import { createProductRouter } from "../infrastructure/web/routes/product_routes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Swagger Config
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Product Management API",
            version: "1.0.0",
            description: "API for managing products, categories, and inventory"
        },
        servers: [{ url: "http://localhost:8000" }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                Product: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        seller_id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        description: { type: "string" },
                        price: { type: "number" },
                        status: { type: "string", enum: ["draft", "active", "inactive"] },
                        image_url: { type: "string" },
                        created_at: { type: "string", format: "date-time" },
                        updated_at: { type: "string", format: "date-time" },
                    }
                },
                Category: {
                    type: "object",
                    properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        parent_id: { type: "string", format: "uuid", nullable: true },
                        created_at: { type: "string", format: "date-time" },
                    }
                },
                Inventory: {
                    type: "object",
                    properties: {
                        product_id: { type: "string", format: "uuid" },
                        stock: { type: "integer" },
                        updated_at: { type: "string", format: "date-time" },
                    }
                }
            }
        },
    },
    apis: [
        "./src/infrastructure/web/routes/*.ts",
        "./src/infrastructure/web/routes/*.js",
        "./dist/src/infrastructure/web/routes/*.js"
    ],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

async function start() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected");

        const messagingService = new RabbitMQService();
        await messagingService.connect();
        console.log("RabbitMQ connected");

        const productRepo = new TypeORMProductRepository();
        const categoryRepo = new TypeORMCategoryRepository();
        const inventoryRepo = new TypeORMInventoryRepository();

        const productUseCases = new ProductUseCases(productRepo, categoryRepo, messagingService);
        const categoryUseCases = new CategoryUseCases(categoryRepo);
        const inventoryUseCases = new InventoryUseCases(inventoryRepo, productRepo);

        const productController = new ProductController(productUseCases);
        const categoryController = new CategoryController(categoryUseCases);
        const inventoryController = new InventoryController(inventoryUseCases);

        const router = createProductRouter(productController, categoryController, inventoryController);
        app.use("/api/v1", router);

        // Expose Swagger JSON
        app.get("/swagger.json", (req, res) => {
            res.json(swaggerSpec);
        });

        const PORT = process.env.PORT || 8000;
        app.listen(PORT, () => console.log(`Product Service running on port ${PORT}`));
    } catch (error) {
        console.error("Startup error:", error);
    }
}

start();
