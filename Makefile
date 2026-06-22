# Konfigurasi Container Engine
# Ubah menjadi 'docker' jika Anda menggunakan Docker, default 'podman'
DOCKER ?= podman
# Untuk podman biasanya menggunakan podman-compose
DOCKER_COMPOSE ?= $(DOCKER)-compose

.PHONY: help redis-up redis-down backend worker frontend dev-backend

help:
	@echo "Perintah Shortcut (Makefile):"
	@echo "  make infra-up    : Menjalankan Redis & DB via $(DOCKER)"
	@echo "  make infra-down  : Mematikan Infrastruktur"
	@echo "  make backend     : Menjalankan API Server (FastAPI)"
	@echo "  make worker      : Menjalankan Background Worker (Celery)"
	@echo "  make frontend    : Menjalankan UI Web (Next.js)"
	@echo "  make dev-backend : Menjalankan FastAPI & Celery bersamaan (Butuh terminal terpisah atau support make -j2)"

# --- INFRASTRUCTURE (REDIS & DB) ---
infra-up:
	$(DOCKER_COMPOSE) up -d

infra-down:
	$(DOCKER_COMPOSE) down

# --- BACKEND ---
google-auth:
	cd backend && ./venv/bin/python -c "from app.infrastructure.google_auth import get_credentials; get_credentials()"

backend:
	cd backend && ./venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000

worker:
	cd backend && ./venv/bin/watchmedo auto-restart --directory=./ --pattern=*.py --recursive -- ./venv/bin/celery -A worker.celery_app worker --loglevel=info

dev-backend: infra-up
	@echo "Menjalankan Backend & Worker secara paralel..."
	make -j2 backend worker

# --- FRONTEND ---
frontend:
	cd frontend && npm run dev

# --- RUN ALL ---
dev: infra-up
	@echo "Menjalankan Backend, Worker, dan Frontend secara paralel..."
	make -j3 backend worker frontend
