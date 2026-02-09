import { DataSource } from "typeorm";
import { config } from "dotenv";

config();

export default new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "product_db",
    entities: ["src/infrastructure/database/entities/*.ts"],
    migrations: ["src/infrastructure/database/migrations/*.ts"],
    synchronize: false,
});
