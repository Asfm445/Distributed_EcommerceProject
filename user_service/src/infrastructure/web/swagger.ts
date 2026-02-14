import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "User Service API",
            version: "1.0.0",
            description: "Authentication and user management API for the e-commerce platform",
            contact: {
                name: "API Support",
            },
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            format: "uuid",
                            description: "User ID",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "User email address",
                        },
                        first_name: {
                            type: "string",
                            description: "User's first name",
                        },
                        last_name: {
                            type: "string",
                            description: "User's last name",
                        },
                        verified: {
                            type: "boolean",
                            description: "Email verification status",
                        },
                        created_at: {
                            type: "string",
                            format: "date-time",
                            description: "Account creation timestamp",
                        },
                    },
                },
                RegisterRequest: {
                    type: "object",
                    required: ["email", "password", "first_name", "last_name"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "user@example.com",
                        },
                        password: {
                            type: "string",
                            format: "password",
                            minLength: 8,
                            example: "SecurePass123!",
                        },
                        first_name: {
                            type: "string",
                            example: "John",
                        },
                        last_name: {
                            type: "string",
                            example: "Doe",
                        },
                    },
                },
                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "user@example.com",
                        },
                        password: {
                            type: "string",
                            format: "password",
                            example: "SecurePass123!",
                        },
                    },
                },
                LoginResponse: {
                    type: "object",
                    properties: {
                        accessToken: {
                            type: "string",
                            description: "JWT access token (15 minutes validity)",
                        },
                        refreshToken: {
                            type: "string",
                            description: "Refresh token (7 days validity)",
                        },
                    },
                },
                RefreshRequest: {
                    type: "object",
                    required: ["refresh_token"],
                    properties: {
                        refresh_token: {
                            type: "string",
                            description: "Valid refresh token",
                        },
                    },
                },
                VerificationRequest: {
                    type: "object",
                    required: ["email"],
                    properties: {
                        email: {
                            type: "string",
                            format: "email",
                            example: "user@example.com",
                        },
                    },
                },
                LogoutRequest: {
                    type: "object",
                    required: ["refresh_token"],
                    properties: {
                        refresh_token: {
                            type: "string",
                            description: "Refresh token to invalidate",
                        },
                    },
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        error: {
                            type: "string",
                            description: "Error message",
                        },
                    },
                },
                SuccessResponse: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            description: "Success message",
                        },
                    },
                },
            },
        },
    },
    apis: ["./src/infrastructure/web/routes/*.ts", "./dist/infrastructure/web/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
