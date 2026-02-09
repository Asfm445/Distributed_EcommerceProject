import { Entity, PrimaryColumn, Column, UpdateDateColumn, Check } from "typeorm";

@Entity("inventory")
@Check("stock >= 0")
export class InventoryEntity {
    @PrimaryColumn({ type: "uuid", name: "product_id" })
    productId!: string;

    @Column({ type: "integer" })
    stock!: number;

    @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
    updatedAt!: Date;
}
