import "reflect-metadata";
import { DataSource } from "typeorm";
import { ProductEntity } from "./entities/product_entity.js";
import { CategoryEntity } from "./entities/category_entity.js";
import { ProductAttributeEntity } from "./entities/product_attribute_entity.js";
import { InventoryEntity } from "./entities/inventory_entity.js";
import { ProductCategoryEntity } from "./entities/product_category_entity.js";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "product_db",
    synchronize: false, // Disabled - use migrations instead
    logging: false,
    entities: [
        ProductEntity,
        CategoryEntity,
        ProductAttributeEntity,
        InventoryEntity,
        ProductCategoryEntity
    ],
    migrations: ["dist/infrastructure/database/migrations/*.js"],
    migrationsRun: true, // Auto-run migrations on startup disabled
    subscribers: [],
});
