import grpc from 'k6/net/grpc';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import {
    GRPC_SERVER,
    generateUUID,
    commonThresholds,
    getScenario
} from './config.js';

// Custom metrics
const orderStatusErrors = new Counter('order_status_errors');
const orderStatusDuration = new Trend('order_status_duration');

// Pre-generate order IDs for testing
// In a real scenario, you would populate this with actual order IDs from your database
const orderIds = new SharedArray('orderIds', function () {
    const ids = [];
    for (let i = 0; i < 100; i++) {
        ids.push(generateUUID());
    }
    return ids;
});

// Test configuration
export const options = {
    scenarios: {
        getOrderStatus: getScenario(),
    },
    thresholds: {
        'order_status_errors': ['count<10'],
        'order_status_duration': ['p(95)<300'], // Read operations should be faster
        'checks': ['rate>0.95'],
    },
};

const client = new grpc.Client();
client.load(['..'], 'proto/order.proto');

export default function () {
    // Connect to gRPC server
    client.connect(GRPC_SERVER, {
        plaintext: true,
    });

    // Select a random order ID from the pool
    const orderId = orderIds[Math.floor(Math.random() * orderIds.length)];

    // Make gRPC call
    const response = client.invoke('ecommerce.orders.OrderService/GetOrderStatus', {
        order_id: orderId,
    });

    // Validate response
    // Note: Since we're using random UUIDs, we expect NotFound errors
    // In a real scenario, you'd want to use actual order IDs
    const success = check(response, {
        'status is OK or NotFound': (r) =>
            r && (r.status === grpc.StatusOK || r.status === grpc.StatusNotFound),
        'response structure is valid': (r) => r && r.message !== undefined,
    });

    if (!success) {
        orderStatusErrors.add(1);
        console.error(`GetOrderStatus failed: ${JSON.stringify(response)}`);
    } else if (response.status === grpc.StatusOK && response.timings && response.timings.duration) {
        orderStatusDuration.add(response.timings.duration);
    }

    client.close();

    // Think time between requests
    sleep(0.5); // Shorter sleep for read operations
}

export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    };
}

function textSummary(data, options = {}) {
    const indent = options.indent || '';

    let summary = '\n';
    summary += `${indent}✓ GetOrderStatus Load Test Summary\n`;
    summary += `${indent}${'='.repeat(50)}\n\n`;

    // Test duration
    const testDuration = data.state.testRunDurationMs / 1000;
    summary += `${indent}Test Duration: ${testDuration.toFixed(2)}s\n\n`;

    // Requests
    const iterations = data.metrics.iterations.values.count || 0;
    const requestRate = (iterations / testDuration).toFixed(2);
    summary += `${indent}Total Requests: ${iterations}\n`;
    summary += `${indent}Request Rate: ${requestRate} req/s\n\n`;

    // Response times
    if (data.metrics.grpc_req_duration) {
        const p95 = data.metrics.grpc_req_duration.values['p(95)'] || 0;
        const p99 = data.metrics.grpc_req_duration.values['p(99)'] || 0;
        const avg = data.metrics.grpc_req_duration.values.avg || 0;

        summary += `${indent}Response Times:\n`;
        summary += `${indent}  avg: ${avg.toFixed(2)}ms\n`;
        summary += `${indent}  p95: ${p95.toFixed(2)}ms\n`;
        summary += `${indent}  p99: ${p99.toFixed(2)}ms\n\n`;
    }

    // Error rate
    const errors = data.metrics.order_status_errors?.values.count || 0;
    const errorRate = iterations > 0 ? ((errors / iterations) * 100).toFixed(2) : 0;
    summary += `${indent}Errors: ${errors} (${errorRate}%)\n\n`;

    // Note about test data
    summary += `${indent}Note: This test uses random UUIDs. For realistic results,\n`;
    summary += `${indent}populate the orderIds array with actual order IDs.\n\n`;

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
