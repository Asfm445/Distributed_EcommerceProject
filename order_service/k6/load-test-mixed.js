import grpc from 'k6/net/grpc';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import {
    GRPC_SERVER,
    generateCreateOrderRequest,
    generateUUID,
    commonThresholds
} from './config.js';

// Custom metrics
const createOrderCount = new Counter('create_order_count');
const getOrderCount = new Counter('get_order_count');
const createOrderErrors = new Counter('create_order_errors');
const getOrderErrors = new Counter('get_order_errors');
const createOrderDuration = new Trend('create_order_duration');
const getOrderDuration = new Trend('get_order_duration');

// Store created order IDs for subsequent GetOrderStatus calls
const createdOrderIds = [];

// Pre-generate some order IDs for initial GetOrderStatus calls
const initialOrderIds = new SharedArray('initialOrderIds', function () {
    const ids = [];
    for (let i = 0; i < 50; i++) {
        ids.push(generateUUID());
    }
    return ids;
});

// Test configuration - Mixed workload
export const options = {
    scenarios: {
        mixedWorkload: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 5 },   // Warm up
                { duration: '2m', target: 15 },   // Ramp up to 15 users
                { duration: '5m', target: 15 },   // Stay at 15 users
                { duration: '1m', target: 0 },    // Ramp down
            ],
        },
    },
    thresholds: {
        'create_order_errors': ['count<20'],
        'get_order_errors': ['count<10'],
        'create_order_duration': ['p(95)<600'],
        'get_order_duration': ['p(95)<300'],
        'checks': ['rate>0.90'], // 90% of checks should pass
    },
};

const client = new grpc.Client();
client.load(['..'], 'proto/order.proto');

export default function () {
    // Connect to gRPC server
    client.connect(GRPC_SERVER, {
        plaintext: true,
    });

    // 70% CreateOrder, 30% GetOrderStatus
    const random = Math.random();

    if (random < 0.7) {
        // CreateOrder
        const request = generateCreateOrderRequest();
        const response = client.invoke('ecommerce.orders.OrderService/CreateOrder', request);

        createOrderCount.add(1);

        const success = check(response, {
            'CreateOrder: status is OK': (r) => r && r.status === grpc.StatusOK,
            'CreateOrder: has order_id': (r) => r && r.message && r.message.order_id !== '',
        });

        if (!success) {
            createOrderErrors.add(1);
        } else {
            createOrderDuration.add(response.timings.duration);
            // Store the created order ID for future GetOrderStatus calls
            if (response.message && response.message.order_id) {
                createdOrderIds.push(response.message.order_id);
            }
        }
    } else {
        // GetOrderStatus
        // Use created order IDs if available, otherwise use initial random IDs
        let orderId;
        if (createdOrderIds.length > 0) {
            orderId = createdOrderIds[Math.floor(Math.random() * createdOrderIds.length)];
        } else {
            orderId = initialOrderIds[Math.floor(Math.random() * initialOrderIds.length)];
        }

        const response = client.invoke('ecommerce.orders.OrderService/GetOrderStatus', {
            order_id: orderId,
        });

        getOrderCount.add(1);

        const success = check(response, {
            'GetOrderStatus: status is OK or NotFound': (r) =>
                r && (r.status === grpc.StatusOK || r.status === grpc.StatusNotFound),
        });

        if (!success) {
            getOrderErrors.add(1);
        } else if (response.status === grpc.StatusOK) {
            getOrderDuration.add(response.timings.duration);
        }
    }

    client.close();

    // Variable think time
    sleep(Math.random() * 2 + 0.5); // 0.5-2.5 seconds
}

export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    };
}

function textSummary(data, options = {}) {
    const indent = options.indent || '';

    let summary = '\n';
    summary += `${indent}✓ Mixed Workload Load Test Summary\n`;
    summary += `${indent}${'='.repeat(50)}\n\n`;

    // Test duration
    const testDuration = data.state.testRunDurationMs / 1000;
    summary += `${indent}Test Duration: ${testDuration.toFixed(2)}s\n\n`;

    // Request breakdown
    const createCount = data.metrics.create_order_count?.values.count || 0;
    const getCount = data.metrics.get_order_count?.values.count || 0;
    const totalRequests = createCount + getCount;

    summary += `${indent}Request Breakdown:\n`;
    summary += `${indent}  CreateOrder: ${createCount} (${((createCount / totalRequests) * 100).toFixed(1)}%)\n`;
    summary += `${indent}  GetOrderStatus: ${getCount} (${((getCount / totalRequests) * 100).toFixed(1)}%)\n`;
    summary += `${indent}  Total: ${totalRequests}\n`;
    summary += `${indent}  Request Rate: ${(totalRequests / testDuration).toFixed(2)} req/s\n\n`;

    // Response times
    if (data.metrics.create_order_duration) {
        const p95 = data.metrics.create_order_duration.values['p(95)'] || 0;
        const avg = data.metrics.create_order_duration.values.avg || 0;
        summary += `${indent}CreateOrder Response Times:\n`;
        summary += `${indent}  avg: ${avg.toFixed(2)}ms\n`;
        summary += `${indent}  p95: ${p95.toFixed(2)}ms\n\n`;
    }

    if (data.metrics.get_order_duration) {
        const p95 = data.metrics.get_order_duration.values['p(95)'] || 0;
        const avg = data.metrics.get_order_duration.values.avg || 0;
        summary += `${indent}GetOrderStatus Response Times:\n`;
        summary += `${indent}  avg: ${avg.toFixed(2)}ms\n`;
        summary += `${indent}  p95: ${p95.toFixed(2)}ms\n\n`;
    }

    // Error rates
    const createErrors = data.metrics.create_order_errors?.values.count || 0;
    const getErrors = data.metrics.get_order_errors?.values.count || 0;

    summary += `${indent}Errors:\n`;
    summary += `${indent}  CreateOrder: ${createErrors} (${createCount > 0 ? ((createErrors / createCount) * 100).toFixed(2) : 0}%)\n`;
    summary += `${indent}  GetOrderStatus: ${getErrors} (${getCount > 0 ? ((getErrors / getCount) * 100).toFixed(2) : 0}%)\n\n`;

    // Thresholds
    summary += `${indent}Thresholds:\n`;
    for (const [name, threshold] of Object.entries(data.metrics)) {
        if (threshold.thresholds) {
            for (const [thresholdName, thresholdData] of Object.entries(threshold.thresholds)) {
                const passed = thresholdData.ok ? '✓' : '✗';
                summary += `${indent}  ${passed} ${name}: ${thresholdName}\n`;
            }
        }
    }

    return summary;
}
