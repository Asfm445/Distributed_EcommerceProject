import { Request, Response } from "express";
import { CategoryUseCases } from "../../../application/usecases/category_usecases.js";

export class CategoryController {
    constructor(private categoryUseCases: CategoryUseCases) { }

    async create(req: Request, res: Response) {
        try {
            const category = await this.categoryUseCases.createCategory(req.body);
            res.status(201).json(category);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async getTree(req: Request, res: Response) {
        try {
            const tree = await this.categoryUseCases.getCategoryTree();
            res.json(tree);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }
}
