import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const PROTO_PATH = path.resolve(__dirname, '../proto/order.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const orderProto: any = (grpc.loadPackageDefinition(packageDefinition) as any).ecommerce.orders;

const createOrder = (call: any, callback: any) => {
    console.log('Received CreateOrder request:', JSON.stringify(call.request, null, 2));

    const response = {
        order_id: uuidv4(),
        status: 'CREATED',
        created_at: new Date().toISOString(),
    };

    callback(null, response);
};

const getOrderStatus = (call: any, callback: any) => {
    console.log('Received GetOrderStatus request:', call.request.order_id);

    const response = {
        order_id: call.request.order_id,
        status: 'SHIPPED', // Mocked status
        created_at: new Date().toISOString(),
    };

    callback(null, response);
};

const main = () => {
    const server = new grpc.Server();
    server.addService(orderProto.OrderService.service, {
        createOrder,
        getOrderStatus,
    });

    const port = process.env.ORDER_GRPC_PORT || '50051';
    server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err) {
            console.error('Failed to bind server:', err);
            return;
        }
        console.log(`Mock Order gRPC server running at http://0.0.0.0:${port}`);
        server.start();
    });
};

main();
