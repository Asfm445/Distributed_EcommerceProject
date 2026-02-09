import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";

@Entity("categories")
@Index("idx_categories_parent_id", ["parentId"])
@Index("uq_categories_parent_name", ["parentId", "name"], { unique: true })
export class CategoryEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "text" })
    name!: string;

    @Column({ type: "uuid", nullable: true, name: "parent_id" })
    parentId!: string | null;

    @ManyToOne(() => CategoryEntity, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "parent_id" })
    parent?: CategoryEntity;

    @CreateDateColumn({ type: "timestamptz", name: "created_at" })
    createdAt!: Date;
}
