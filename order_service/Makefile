DB_URL=$(ORDER_DATABASE_URL)
MIGRATIONS_PATH=migrations

.PHONY: migrate-create
migrate-create:
	migrate create -ext sql -dir $(MIGRATIONS_PATH) -seq $(name)

.PHONY: migrate-up
migrate-up:
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" up

.PHONY: migrate-down
migrate-down:
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" down

.PHONY: migrate-force
migrate-force:
	migrate -path $(MIGRATIONS_PATH) -database "$(DB_URL)" force $(version)

# k6 Load Testing Targets
.PHONY: load-test-smoke load-test-load load-test-stress load-test-spike load-test-mixed load-test-get-order

load-test-smoke:
	@echo "Running smoke test for CreateOrder..."
	k6 run --env SCENARIO=smoke k6/load-test-create-order.js

load-test-load:
	@echo "Running load test for CreateOrder..."
	k6 run --env SCENARIO=load k6/load-test-create-order.js

load-test-stress:
	@echo "Running stress test for CreateOrder..."
	k6 run --env SCENARIO=stress k6/load-test-create-order.js

load-test-spike:
	@echo "Running spike test for CreateOrder..."
	k6 run --env SCENARIO=spike k6/load-test-create-order.js

load-test-get-order:
	@echo "Running load test for GetOrderStatus..."
	k6 run --env SCENARIO=load k6/load-test-get-order.js

load-test-mixed:
	@echo "Running mixed workload test..."
	k6 run k6/load-test-mixed.js

