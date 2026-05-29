.PHONY: help build up down logs restart health clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## Tail logs from all services
	docker-compose logs -f

logs-web: ## Tail logs from web service only
	docker-compose logs -f web

logs-nginx: ## Tail logs from nginx only
	docker-compose logs -f nginx

restart: ## Restart all services
	docker-compose restart

restart-web: ## Restart web service only
	docker-compose restart web

health: ## Check service health
	@echo "Checking application health..."
	@curl -f http://localhost:3000/api/health 2>/dev/null && echo "✓ App healthy" || echo "✗ App unhealthy"
	@docker-compose ps

ps: ## Show running containers
	docker-compose ps

stats: ## Show container resource usage
	docker stats --no-stream

clean: ## Remove containers and images
	docker-compose down -v
	docker system prune -f

deploy-local: build up health ## Full local deployment

dev: ## Start in development mode (if dev compose exists)
	@if [ -f "docker-compose.dev.yml" ]; then \
		docker-compose -f docker-compose.dev.yml up; \
	else \
		echo "No docker-compose.dev.yml found. Use 'make up' for production."; \
	fi
