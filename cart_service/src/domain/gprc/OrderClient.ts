import { Cart } from "../entities/Cart";


export interface IOrderClient {
    createOrder(cart: Cart, shippingAddress: any): Promise<any>;
}