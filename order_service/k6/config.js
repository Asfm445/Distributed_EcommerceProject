// Shared configuration for k6 load tests
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// gRPC server configuration
export const GRPC_SERVER = __ENV.GRPC_SERVER || 'localhost:50051';

// Test data generators
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function generateAddress() {
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
    const streets = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Rd', 'Elm St', 'Washington Blvd', 'Park Ave'];
    const names = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Charlie Brown', 'Diana Davis'];

    return {
        full_name: names[randomIntBetween(0, names.length - 1)],
        phone: `+1${randomIntBetween(2000000000, 9999999999)}`,
        city: cities[randomIntBetween(0, cities.length - 1)],
        street: `${randomIntBetween(1, 9999)} ${streets[randomIntBetween(0, streets.length - 1)]}`
    };
}

export function generateOrderItem() {
    const products = [
        { name: 'Laptop', price: 999.99 },
        { name: 'Smartphone', price: 699.99 },
        { name: 'Headphones', price: 149.99 },
        { name: 'Keyboard', price: 79.99 },
        { name: 'Mouse', price: 49.99 },
        { name: 'Monitor', price: 299.99 },
        { name: 'Tablet', price: 499.99 },
        { name: 'Smartwatch', price: 249.99 }
    ];

    const product = products[randomIntBetween(0, products.length - 1)];
    const quantity = randomIntBetween(1, 5);

    return {
        product_id: generateUUID(),
        seller_id: generateUUID(),
        product_name: product.name,
        unit_price: product.price,
        quantity: quantity
    };
}

export function generateCreateOrderRequest() {
    const numItems = randomIntBetween(1, 5);
    const items = [];
    let totalAmount = 0;

    for (let i = 0; i < numItems; i++) {
        const item = generateOrderItem();
        items.push(item);
        totalAmount += item.unit_price * item.quantity;
    }

    return {
        user_id: generateUUID(),
        items: items,
        shipping_address: generateAddress(),
        total_amount: totalAmount
    };
}

// Common thresholds for all tests
export const commonThresholds = {
    'grpc_streams_msgs_sent': ['count>0'],
    'grpc_streams_msgs_received': ['count>0'],
};

// Test scenarios
export const scenarios = {
    smoke: {
        executor: 'constant-vus',
        vus: 1,
        duration: '30s',
    },
    load: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
            { duration: '12s', target: 200 },  // Ramp up to 10 users
            { duration: '36s', target: 200 },  // Stay at 10 users
            { duration: '12s', target: 0 },   // Ramp down to 0 users
        ],
    },
    stress: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
            { duration: '2m', target: 20 },  // Ramp up to 20 users
            { duration: '5m', target: 20 },  // Stay at 20 users
            { duration: '2m', target: 50 },  // Ramp up to 50 users
            { duration: '5m', target: 50 },  // Stay at 50 users
            { duration: '2m', target: 0 },   // Ramp down to 0 users
        ],
    },
    spike: {
        executor: 'ramping-vus',
        startVUs: 0,
        stages: [
            { duration: '10s', target: 5 },   // Warm up
            { duration: '10s', target: 100 }, // Spike to 100 users
            { duration: '3m', target: 100 },  // Stay at 100 users
            { duration: '10s', target: 5 },   // Scale down
            { duration: '10s', target: 0 },   // Ramp down to 0
        ],
    },
};

// Get scenario based on environment variable
export function getScenario() {
    const scenarioName = __ENV.SCENARIO || 'smoke';
    return scenarios[scenarioName] || scenarios.smoke;
}
