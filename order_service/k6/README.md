# k6 Load Testing for Order Service

This directory contains k6 load testing scripts for the order_service gRPC endpoints.

## Prerequisites

### Install k6

k6 is required to run these load tests. Install it using one of the following methods:

**Ubuntu/Debian:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**macOS:**
```bash
brew install k6
```

**Other platforms:** See [k6 installation docs](https://k6.io/docs/get-started/installation/)

### Ensure Service is Running

Make sure the order_service is running and accessible:

```bash
# From the project root
cd /home/awel/coding/EcommerceProject
docker-compose up -d order-service
```

The service should be running on `localhost:50051` by default.

## Test Scripts

### 1. `load-test-create-order.js`
Tests the `CreateOrder` endpoint with various load scenarios.

**Features:**
- Generates realistic order data (random items, addresses, prices)
- Multiple test scenarios (smoke, load, stress, spike)
- Custom metrics for order creation
- Detailed summary reports

### 2. `load-test-get-order.js`
Tests the `GetOrderStatus` endpoint.

**Features:**
- Uses pre-generated order IDs
- Optimized thresholds for read operations
- Lower latency expectations (p95 < 300ms)

**Note:** This test uses random UUIDs by default. For realistic results, populate the `orderIds` array with actual order IDs from your database.

### 3. `load-test-mixed.js`
Simulates realistic mixed workload.

**Features:**
- 70% CreateOrder requests
- 30% GetOrderStatus requests
- Variable think time between requests
- Separate metrics for each operation type

### 4. `config.js`
Shared configuration and utilities.

**Contains:**
- gRPC server configuration
- Test data generators
- Common thresholds
- Test scenario definitions

## Running Tests

### Using Make (Recommended)

```bash
# From the order_service directory
cd /home/awel/coding/EcommerceProject/order_service

# Run smoke test (quick validation)
make load-test-smoke

# Run load test (sustained load)
make load-test-load

# Run stress test (find breaking point)
make load-test-stress

# Run spike test (sudden traffic spike)
make load-test-spike

# Run GetOrderStatus test
make load-test-get-order

# Run mixed workload test
make load-test-mixed
```

### Using k6 Directly

```bash
# From the order_service directory
cd /home/awel/coding/EcommerceProject/order_service

# Run with specific scenario
k6 run --env SCENARIO=smoke k6/load-test-create-order.js
k6 run --env SCENARIO=load k6/load-test-create-order.js
k6 run --env SCENARIO=stress k6/load-test-create-order.js
k6 run --env SCENARIO=spike k6/load-test-create-order.js

# Run mixed workload
k6 run k6/load-test-mixed.js

# Override gRPC server address
k6 run --env GRPC_SERVER=myserver:50051 k6/load-test-create-order.js
```

## Test Scenarios

### Smoke Test
- **Purpose:** Validate that the script works correctly
- **Load:** 1 virtual user for 30 seconds
- **When to use:** After making changes to test scripts or service

### Load Test
- **Purpose:** Test normal expected load
- **Load:** Ramp up to 10 VUs over 1 minute, sustain for 3 minutes, ramp down
- **When to use:** Regular performance testing

### Stress Test
- **Purpose:** Find the breaking point
- **Load:** Ramp up to 50 VUs progressively
- **When to use:** Capacity planning

### Spike Test
- **Purpose:** Test behavior under sudden traffic spikes
- **Load:** Sudden spike to 100 VUs
- **When to use:** Validate auto-scaling and error handling

## Understanding Results

### Key Metrics

- **grpc_req_duration:** Response time for gRPC requests
  - `avg`: Average response time
  - `p(95)`: 95th percentile (95% of requests faster than this)
  - `p(99)`: 99th percentile

- **grpc_req_failed:** Failed request rate
  - Should be < 1% for healthy service

- **iterations:** Number of complete test iterations
- **Request Rate:** Requests per second (throughput)

### Thresholds

Tests will fail if thresholds are not met:

- ✅ **p(95) < 500ms:** 95% of CreateOrder requests complete in under 500ms
- ✅ **p(95) < 300ms:** 95% of GetOrderStatus requests complete in under 300ms
- ✅ **Error rate < 1%:** Less than 1% of requests fail

### Sample Output

```
✓ CreateOrder Load Test Summary
==================================================

Test Duration: 300.00s

Total Requests: 2847
Request Rate: 9.49 req/s

Response Times:
  avg: 245.32ms
  p95: 412.18ms
  p99: 587.43ms

Errors: 3 (0.11%)

Thresholds:
  ✓ grpc_req_duration{expected_response:true}: p(95)<500
  ✓ grpc_req_failed: rate<0.01
```

## Customization

### Modify Test Data

Edit `config.js` to customize:
- Product names and prices
- Address data (cities, streets, names)
- Order item quantities
- UUID generation

### Adjust Thresholds

Edit the `thresholds` section in each test script:

```javascript
export const options = {
  thresholds: {
    'grpc_req_duration{expected_response:true}': ['p(95)<500'],  // Adjust 500ms
    'grpc_req_failed': ['rate<0.01'],  // Adjust 1% error rate
  },
};
```

### Change Scenarios

Modify the `scenarios` object in `config.js`:

```javascript
load: {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '1m', target: 20 },  // Increase to 20 VUs
    { duration: '5m', target: 20 },  // Sustain for 5 minutes
    { duration: '1m', target: 0 },
  ],
}
```

## Troubleshooting

### Connection Refused

**Error:** `dial tcp [::1]:50051: connect: connection refused`

**Solution:** Ensure order_service is running:
```bash
docker-compose up -d order-service
docker-compose ps order-service
```

### k6 Not Found

**Error:** `k6: command not found`

**Solution:** Install k6 (see Prerequisites section)

### High Error Rate

**Possible causes:**
- Database connection issues
- RabbitMQ connection issues
- Service under too much load
- Invalid test data

**Debug:**
1. Check service logs: `docker-compose logs order-service`
2. Reduce load (use smoke test)
3. Verify database and RabbitMQ are healthy

### Slow Response Times

**Possible causes:**
- Database performance issues
- Network latency
- Insufficient resources

**Solutions:**
- Check database query performance
- Monitor CPU/memory usage
- Scale database connection pool
- Optimize database indexes

## Best Practices

1. **Start with smoke tests** before running larger tests
2. **Monitor service resources** during tests (CPU, memory, database connections)
3. **Run tests in isolation** to avoid interference
4. **Use realistic test data** for accurate results
5. **Gradually increase load** to find the breaking point safely
6. **Document baseline metrics** for comparison over time

## Next Steps

- Set up continuous load testing in CI/CD pipeline
- Create custom dashboards for visualizing results
- Integrate with monitoring tools (Prometheus, Grafana)
- Add more complex scenarios (e.g., user journeys)
- Test with production-like data volumes
