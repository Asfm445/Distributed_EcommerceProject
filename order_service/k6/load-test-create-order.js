import grpc from 'k6/net/grpc';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import {
    GRPC_SERVER,
    generateCreateOrderRequest,
    commonThresholds,
    getScenario
} from './config.js';

// Custom metrics
const orderCreationErrors = new Counter('order_creation_errors');
const orderCreationDuration = new Trend('order_creation_duration');

// Test configuration
export const options = {
    scenarios: {
        createOrder: getScenario(),
    },
    thresholds: {
        'order_creation_errors': ['count<10'],
        'order_creation_duration': ['p(95)<600'],
        'checks': ['rate>0.95'], // 95% of checks should pass
    },
};

const client = new grpc.Client();
client.load(['..'], 'proto/order.proto');

export default function () {
    // Connect to gRPC server
    client.connect(GRPC_SERVER, {
        plaintext: true,
    });

    // Generate test data
    const request = generateCreateOrderRequest();

    // Make gRPC call
    const response = client.invoke('ecommerce.orders.OrderService/CreateOrder', request);

    // Validate response
    const success = check(response, {
        'status is OK': (r) => r && r.status === grpc.StatusOK,
        'response has order_id': (r) => r && r.message && r.message.order_id !== '',
        'response has status': (r) => r && r.message && r.message.status !== '',
        'response has created_at': (r) => r && r.message && r.message.created_at !== '',
    });

    if (!success) {
        orderCreationErrors.add(1);
        console.error(`CreateOrder failed: ${JSON.stringify(response)}`);
    } else if (response.timings && response.timings.duration) {
        orderCreationDuration.add(response.timings.duration);
    }

    client.close();

    // Think time between requests
    sleep(1);
}

export function handleSummary(data) {
    return {
        'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    };
}

function textSummary(data, options = {}) {
    const indent = options.indent || '';
    const enableColors = options.enableColors || false;

    let summary = '\n';
    summary += `${indent}✓ CreateOrder Load Test Summary\n`;
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
    const errors = data.metrics.order_creation_errors?.values.count || 0;
    const errorRate = iterations > 0 ? ((errors / iterations) * 100).toFixed(2) : 0;
    summary += `${indent}Errors: ${errors} (${errorRate}%)\n\n`;

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
