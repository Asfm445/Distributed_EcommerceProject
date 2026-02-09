import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1770466561666 implements MigrationInterface {
    name = 'InitialSchema1770466561666'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."products_status_enum" AS ENUM('draft', 'active', 'inactive')`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "seller_id" uuid NOT NULL, "name" text NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "status" "public"."products_status_enum" NOT NULL DEFAULT 'draft', "image_url" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_products_created_at" ON "products" ("created_at") `);
        await queryRunner.query(`CREATE INDEX "idx_products_status" ON "products" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_products_seller_id" ON "products" ("seller_id") `);
        await queryRunner.query(`CREATE TABLE "product_categories" ("product_id" uuid NOT NULL, "category_id" uuid NOT NULL, CONSTRAINT "PK_54f2e1dbf14cfa770f59f0aac8f" PRIMARY KEY ("product_id", "category_id"))`);
        await queryRunner.query(`CREATE INDEX "idx_product_categories_category_id" ON "product_categories" ("category_id") `);
        await queryRunner.query(`CREATE TABLE "product_attributes" ("product_id" uuid NOT NULL, "attributes" jsonb NOT NULL, CONSTRAINT "PK_f5a6700abd0494bae3032cf5bbd" PRIMARY KEY ("product_id"))`);
        await queryRunner.query(`CREATE TABLE "inventory" ("product_id" uuid NOT NULL, "stock" integer NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_8d1af38edcd74ccd7c19953d9a" CHECK (stock >= 0), CONSTRAINT "PK_732fdb1f76432d65d2c136340dc" PRIMARY KEY ("product_id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "parent_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "uq_categories_parent_name" ON "categories" ("parent_id", "name") `);
        await queryRunner.query(`CREATE INDEX "idx_categories_parent_id" ON "categories" ("parent_id") `);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`);
        await queryRunner.query(`DROP INDEX "public"."idx_categories_parent_id"`);
        await queryRunner.query(`DROP INDEX "public"."uq_categories_parent_name"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "inventory"`);
        await queryRunner.query(`DROP TABLE "product_attributes"`);
        await queryRunner.query(`DROP INDEX "public"."idx_product_categories_category_id"`);
        await queryRunner.query(`DROP TABLE "product_categories"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_seller_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_products_created_at"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
    }

}
