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
