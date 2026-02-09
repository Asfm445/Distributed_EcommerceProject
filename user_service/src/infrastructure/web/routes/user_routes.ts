import { Router } from "express";
import { UserController } from "../controllers/user_controller.js";
import { authMiddleware } from "../middlewares/auth_middleware.js";

/**
 * @openapi
 * tags:
 *   name: Users
 *   description: User management and profile operations
 */

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @openapi
 * /api/v1/users/apply-seller:
 *   put:
 *     summary: Apply for seller role
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Promoted to seller successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 */

/**
 * @openapi
 * /api/v1/users/{user_id}/promote-admin:
 *   put:
 *     summary: Promote a user to admin
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to promote
 *     responses:
 *       200:
 *         description: User promoted to admin successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only admins can promote others
 */

export function createUserRouter(userController: UserController): Router {
    const router = Router();

    router.get("/me", authMiddleware(), (req: any, res) => userController.getMe(req, res));
    router.put("/apply-seller", authMiddleware(), (req: any, res) => userController.applySeller(req, res));
    router.put("/:user_id/promote-admin", authMiddleware(["admin"]), (req: any, res) => userController.promoteAdmin(req, res));

    return router;
}
