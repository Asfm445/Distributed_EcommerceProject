import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { AuthUseCases } from "../application/usecases/auth_usecases.js";
import { UserUseCases } from "../application/usecases/user_usecases.js";
import { MongoUserRepository } from "../infrastructure/repositories/mongo_user_repository.js";
import { TokenService, PasswordHasher, MockEmailService } from "../infrastructure/services/services.js";
import { AuthController } from "../infrastructure/web/controllers/auth_controller.js";
import { UserController } from "../infrastructure/web/controllers/user_controller.js";
import { createAuthRouter } from "../infrastructure/web/routes/auth_routes.js";
import { createUserRouter } from "../infrastructure/web/routes/user_routes.js";
import { authMiddleware } from "../infrastructure/web/middlewares/auth_middleware.js";
import { swaggerSpec } from "../infrastructure/web/swagger.js";

const result = dotenv.config();
if (result.error) {
    console.error("Dotenv load error:", result.error);
} else {
    console.log("Dotenv loaded successfully");
    console.log("Project root:", process.cwd());
}

const app = express();
app.use(express.json());

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialize Dependencies
const userRepository = new MongoUserRepository();
const tokenService = new TokenService();
const passwordHasher = new PasswordHasher();
const emailService = new MockEmailService();

const authUseCases = new AuthUseCases(
    userRepository,
    tokenService,
    emailService,
    passwordHasher
);

const userUseCases = new UserUseCases(userRepository);

const authController = new AuthController(authUseCases);
const userController = new UserController(userUseCases);

const authRouter = createAuthRouter(authController);
const userRouter = createUserRouter(userController);

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);

// Expose Swagger JSON
app.get("/swagger.json", (req, res) => {
    res.json(swaggerSpec);
});


const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/user_db";
console.log(MONGODB_URI);

async function start() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        app.listen(PORT, () => {
            console.log(`User Service running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start service:", error);
    }
}

start();
export { app };
