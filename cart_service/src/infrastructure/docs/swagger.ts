import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Cart Service API',
            version: '1.0.0',
            description: 'API documentation for the Cart Service',
        },
        servers: [
            {
                url: 'http://localhost:8001/api/v1/cart',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                BearerAuth: [],
            },
        ],
    },
    apis: ['./src/interfaces/http/routes/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(options);
