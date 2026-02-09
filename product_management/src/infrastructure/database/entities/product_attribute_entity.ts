import { Entity, PrimaryColumn, Column, Index } from "typeorm";

@Entity("product_attributes")
export class ProductAttributeEntity {
    @PrimaryColumn({ type: "uuid", name: "product_id" })
    productId!: string;

    @Column({ type: "jsonb" })
    @Index("idx_product_attributes_jsonb", { synchronize: false })
    attributes!: Record<string, any>;
}
