import { ICategoryRepository } from "../../domain/repositories/interfaces.js";
import { Category } from "../../domain/entities/models.js";
import { v4 as uuidv4 } from "uuid";

export class CategoryUseCases {
    constructor(private categoryRepo: ICategoryRepository) { }

    async createCategory(data: { name: string, parentId?: string }) {
        const category = new Category(uuidv4(), data.name, data.parentId || null);
        await this.categoryRepo.create(category);
        return category;
    }

    async getCategoryTree() {
        const all = await this.categoryRepo.findAll();

        const buildTree = (parentId: string | null): any[] => {
            return all
                .filter(c => c.parentId === parentId)
                .map(c => ({
                    id: c.id,
                    name: c.name,
                    children: buildTree(c.id)
                }));
        };

        return buildTree(null);
    }
}
