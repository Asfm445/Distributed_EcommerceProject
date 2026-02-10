export interface CartItem {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    imageUrl?: string;
}

export interface Cart {
    user_id: string;
    items: CartItem[];
    total_amount: number;
    expires_at?: string;
}
