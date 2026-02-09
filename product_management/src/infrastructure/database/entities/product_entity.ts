import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

export enum ProductStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    INACTIVE = "inactive"
}

@Entity("products")
@Index("idx_products_seller_id", ["sellerId"])
@Index("idx_products_status", ["status"])
@Index("idx_products_created_at", ["createdAt"])
export class ProductEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "uuid", name: "seller_id" })
    sellerId!: string;

    @Column({ type: "text" })
    name!: string;

    @Column({ type: "text", nullable: true })
    description!: string | null;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    price!: string;

    @Column({
        type: "enum",
        enum: ProductStatus,
        default: ProductStatus.DRAFT
    })
    status!: ProductStatus;

    @Column({ type: "text", nullable: true, name: "image_url" })
    imageUrl!: string | null;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
