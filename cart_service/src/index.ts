import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './infrastructure/docs/swagger';
import { cartRoutes } from './interfaces/http/routes/CartRoutes';
import { CartController } from './interfaces/http/controllers/CartController';
import { CartUseCases } from './application/use-cases/CartUseCases';
import { RedisCartRepository } from './infrastructure/repositories/RedisCartRepository';
import { OrderClient } from './infrastructure/grpc/OrderClient';

dotenv.config();

const app = express();
app.use(express.json());

// Swagger Documentation
app.use('/api/v1/cart/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// IoC / Dependency Injection
const cartRepository = new RedisCartRepository();
const orderClient = new OrderClient();
const cartUseCases = new CartUseCases(cartRepository, orderClient);
const cartController = new CartController(cartUseCases);

app.use('/api/v1/cart', cartRoutes(cartController));

const port = process.env.PORT || 8001;
app.listen(port, () => {
    console.log(`Cart Service running on port ${port}`);
});
