.PHONY: help build up down logs restart clean migrate test

help:
	@echo "FinGuard Sentinel - Available Commands:"
	@echo "  make build      - Build Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make logs       - View logs"
	@echo "  make restart    - Restart all services"
	@echo "  make clean      - Remove containers and volumes"
	@echo "  make migrate    - Run database migrations"
	@echo "  make test       - Run tests"
	@echo "  make shell-be   - Open backend shell"
	@echo "  make shell-db   - Open database shell"
	@echo "  make monitoring - Start with monitoring stack"
	@echo "  make lint       - Run linters"
	@echo "  make coverage   - Generate test coverage report"

build:
	docker-compose build

up:
	docker-compose up -d
	@echo "Services started. Backend: http://localhost:8000, Frontend: http://localhost:3000"

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

restart:
	docker-compose restart

clean:
	docker-compose down -v
	docker system prune -f

migrate:
	docker-compose exec backend alembic upgrade head

migrate-create:
	@read -p "Enter migration message: " msg; \
	docker-compose exec backend alembic revision --autogenerate -m "$$msg"

shell-be:
	docker-compose exec backend /bin/bash

shell-db:
	docker-compose exec postgres psql -U finguard -d finguard_db

test:
	docker-compose exec backend pytest tests/ -v

test-coverage:
	docker-compose exec backend pytest tests/ -v --cov=app --cov-report=html
	@echo "Coverage report generated in finguard-backend/htmlcov/index.html"

lint-backend:
	cd finguard-backend && black app tests && flake8 app tests

lint-frontend:
	cd finguard-frontend && npm run lint

lint: lint-backend lint-frontend

monitoring:
	docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
	@echo "Monitoring stack started:"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana: http://localhost:3001 (admin/admin)"
	@echo "  AlertManager: http://localhost:9093"

monitoring-down:
	docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml down

dev-backend:
	cd finguard-backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend:
	cd finguard-frontend && npm run dev

health:
	@curl -s http://localhost:8000/api/system/health | python -m json.tool

metrics:
	@curl -s http://localhost:8000/metrics | python -m json.tool

backup-db:
	docker-compose exec postgres pg_dump -U finguard finguard_db > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Database backup created"

restore-db:
	@read -p "Enter backup file path: " file; \
	cat $$file | docker-compose exec -T postgres psql -U finguard finguard_db

init-db:
	docker-compose exec backend bash scripts/init-db.sh
