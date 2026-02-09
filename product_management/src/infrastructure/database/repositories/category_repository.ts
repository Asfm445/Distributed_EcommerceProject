import { ICategoryRepository } from "../../../domain/repositories/interfaces.js";
import { Category } from "../../../domain/entities/models.js";
import { CategoryEntity } from "../entities/category_entity.js";
import { AppDataSource } from "../data_source.js";

export class TypeORMCategoryRepository implements ICategoryRepository {
    private repo = AppDataSource.getRepository(CategoryEntity);

    async create(category: Category): Promise<void> {
        const entity = this.repo.create({
            id: category.id,
            name: category.name,
            parentId: category.parentId,
        });
        await this.repo.save(entity);
    }

    async findAll(): Promise<Category[]> {
        const entities = await this.repo.find();
        return entities.map(e => new Category(e.id, e.name, e.parentId));
    }

    async findById(id: string): Promise<Category | null> {
        const e = await this.repo.findOneBy({ id });
        return e ? new Category(e.id, e.name, e.parentId) : null;
    }
}
