export class Category {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly parentId: string | null = null,
        public readonly createdAt: Date = new Date()
    ) { }
}

export type ProductStatus = 'draft' | 'active' | 'inactive';

export class Product {
    constructor(
        public readonly id: string,
        public readonly sellerId: string,
        public readonly name: string,
        public readonly description: string | null,
        public readonly price: number,
        public readonly status: ProductStatus = 'draft',
        public readonly imageUrl: string | null = null,
        public readonly createdAt: Date = new Date(),
        public readonly updatedAt: Date = new Date()
    ) { }
}

export class ProductAttribute {
    constructor(
        public readonly productId: string,
        public readonly attributes: Record<string, any>
    ) { }
}

export class Inventory {
    constructor(
        public readonly productId: string,
        public readonly stock: number,
        public readonly updatedAt: Date = new Date()
    ) { }
}


export interface IEvent {
    event_id: string;
    event_type: string;
    event_version: number;
    occurred_at: Date;
    producer: string;
    trace_id: string;
    payload: any;
}