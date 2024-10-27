# Variables
DOCKER_COMPOSE=docker/docker-compose.yml

DOCKER_COMPOSE_CMD=docker compose -f $(DOCKER_COMPOSE)
LAB_DIR=Lab

# Règles
.PHONY: all backend frontend stop stop-backend stop-frontend clean prune logs

# Lance le backend et le frontend
all: backend

# Construit les images et lance uniquement le backend (Docker)
backend:
	$(DOCKER_COMPOSE_CMD) up --build

# Arrête le backend et le frontend
stop: stop-backend

# Arrête uniquement le backend (Docker)
stop-backend:
	$(DOCKER_COMPOSE_CMD) stop

# Supprime les containers et les volumes Docker
clean:
	$(DOCKER_COMPOSE_CMD) down -v --remove-orphans

# Supprime les containers et les volumes non utilisés
prune:
	docker system prune -af --volumes

# Affiche les logs du backend
logs-backend:
	$(DOCKER_COMPOSE_CMD) logs

# Affiche les logs du backend en mode interactif
logs-backend-interactive:
	$(DOCKER_COMPOSE_CMD) logs -f || true

re: clean backend

with-logs: backend logs-backend-interactive