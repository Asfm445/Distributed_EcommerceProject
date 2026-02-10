import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { Cart } from '../../domain/entities/Cart';
import { IOrderClient } from '../../domain/gprc/OrderClient';

export class OrderClient implements IOrderClient {
    private client: any;

    constructor() {
        const PROTO_PATH = path.resolve(__dirname, '../../../proto/order.proto');
        const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        });

        const orderProto: any = (grpc.loadPackageDefinition(packageDefinition) as any).ecommerce.orders;
        const orderUrl = process.env.ORDER_SERVICE_URL || 'localhost:50051';

        this.client = new orderProto.OrderService(
            orderUrl,
            grpc.credentials.createInsecure()
        );
    }

    async createOrder(cart: Cart, shippingAddress: any): Promise<any> {
        const request = {
            user_id: cart.user_id,
            items: cart.items.map(item => ({
                product_id: item.productId,
                seller_id: 'mock-seller-id', // Simplified for mock
                product_name: item.productName,
                unit_price: item.unitPrice,
                quantity: item.quantity
            })),
            shipping_address: shippingAddress,
            total_amount: cart.total_amount
        };

        return new Promise((resolve, reject) => {
            this.client.createOrder(request, (err: any, response: any) => {
                if (err) {
                    return reject(err);
                }
                resolve(response);
            });
        });
    }
}
