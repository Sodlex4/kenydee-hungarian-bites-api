#!/bin/bash
# Caddy management (alternative to Cloudflare Tunnel)
# Requires DNS resolution + port forwarding from router.
# Usage: ./caddy.sh [up|down|restart|logs|test]

COMPOSE_DIR="$(cd "$(dirname "$0")/.." && pwd)"

case "${1:-status}" in
  up)
    echo "Starting Caddy reverse proxy on ports 80/443..."
    cd "$COMPOSE_DIR" && docker compose up -d caddy
    echo "Caddy running → localhost:8080"
    ;;
  down)
    echo "Stopping Caddy..."
    cd "$COMPOSE_DIR" && docker compose down caddy
    ;;
  restart)
    cd "$COMPOSE_DIR" && docker compose restart caddy
    ;;
  logs)
    cd "$COMPOSE_DIR" && docker compose logs -f caddy
    ;;
  test)
    echo "Testing local Caddy (port 9090)..."
    curl -s -o /dev/null -w "HTTP 9090 → %{http_code}\n" http://localhost:9090/
    echo "Testing API proxy through Caddy..."
    curl -s http://localhost:9090/api/health | python3 -m json.tool
    ;;
  *)
    echo "Usage: $0 [up|down|restart|logs|test]"
    ;;
esac
