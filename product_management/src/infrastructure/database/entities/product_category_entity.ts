import { Entity, PrimaryColumn, Index } from "typeorm";

@Entity("product_categories")
@Index("idx_product_categories_category_id", ["categoryId"])
export class ProductCategoryEntity {
    @PrimaryColumn({ type: "uuid", name: "product_id" })
    productId!: string;

    @PrimaryColumn({ type: "uuid", name: "category_id" })
    categoryId!: string;
}
