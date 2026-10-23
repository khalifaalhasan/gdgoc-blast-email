# Konfigurasi Container Engine
# Default 'docker'. Pakai podman: make infra-up DOCKER=podman
DOCKER ?= docker
# Docker Compose v2 = "docker compose"; podman memakai "podman-compose"
ifeq ($(DOCKER),docker)
DOCKER_COMPOSE ?= docker compose
else
DOCKER_COMPOSE ?= $(DOCKER)-compose
endif

# Path venv beda antara Windows (Scripts/) dan Mac/Linux (bin/)
ifeq ($(OS),Windows_NT)
VENV_BIN := venv/Scripts
# Celery prefork tidak jalan di Windows
CELERY_POOL := --pool=solo
else
VENV_BIN := venv/bin
CELERY_POOL :=
endif

.PHONY: help install infra-up infra-down google-auth backend worker frontend test dev-backend dev

help:
	@echo "Perintah Shortcut (Makefile):"
	@echo "  make install     : Install dependency backend (venv) & frontend (npm)"
	@echo "  make infra-up    : Menjalankan Redis & DB via $(DOCKER)"
	@echo "  make infra-down  : Mematikan Infrastruktur"
	@echo "  make backend     : Menjalankan API Server (FastAPI)"
	@echo "  make worker      : Menjalankan Background Worker (Celery)"
	@echo "  make frontend    : Menjalankan UI Web (Vite + React)"
	@echo "  make test        : Menjalankan unit test backend"
	@echo "  make dev-backend : Menjalankan FastAPI & Celery bersamaan (Butuh terminal terpisah atau support make -j2)"

# --- SETUP ---
install:
	cd backend && python -m venv venv && $(VENV_BIN)/python -m pip install -r requirements-dev.txt
	cd frontend && npm ci

# --- INFRASTRUCTURE (REDIS & DB) ---
infra-up:
	$(DOCKER_COMPOSE) up -d

infra-down:
	$(DOCKER_COMPOSE) down

# --- BACKEND ---
google-auth:
	cd backend && $(VENV_BIN)/python -c "from src.infrastructure.google_auth import get_credentials; get_credentials()"

backend:
	cd backend && $(VENV_BIN)/python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

worker:
	cd backend && $(VENV_BIN)/watchmedo auto-restart --directory=./src --pattern=*.py --recursive -- $(VENV_BIN)/python -m celery -A src.worker.celery_app worker --loglevel=info $(CELERY_POOL)

test:
	cd backend && $(VENV_BIN)/python -m pytest tests

dev-backend: infra-up
	@echo "Menjalankan Backend & Worker secara paralel..."
	$(MAKE) -j2 backend worker

# --- FRONTEND ---
frontend:
	cd frontend && npm run dev

# --- RUN ALL ---
dev: infra-up
	@echo "Menjalankan Backend, Worker, dan Frontend secara paralel..."
	$(MAKE) -j3 backend worker frontend
