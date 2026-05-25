#!/bin/bash
# Cloudflare Tunnel setup & management
# Usage: ./tunnel.sh [setup|status|restart|logs|stop]

CLOUDFLARED="docker run -it --rm --network host -v ~/.cloudflared:/home/nonroot/.cloudflared cloudflare/cloudflared"
CONFIG_DIR="$(cd "$(dirname "$0")/../cloudflare" && pwd)"

case "${1:-status}" in
  setup)
    echo "=============================================="
    echo "Cloudflare Tunnel Setup"
    echo "=============================================="
    echo ""
    echo "Step 1: Sign up at https://cloudflare.com (Free)"
    echo "Step 2: Change your domain nameservers to Cloudflare's"
    echo "Step 3: Wait for DNS propagation"
    echo ""
    read -p "Done with steps 1-3? (y/N): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
      echo "Run this script again when ready."
      exit 0
    fi
    echo ""
    echo "Step 4: Authenticate (opens browser)"
    echo "Running: cloudflared tunnel login..."
    mkdir -p ~/.cloudflared
    $CLOUDFLARED tunnel login
    echo ""
    echo "Step 5: Create tunnel"
    echo "Running: cloudflared tunnel create hungarian-bites..."
    OUTPUT=$($CLOUDFLARED tunnel create hungarian-bites 2>&1)
    echo "$OUTPUT"
    TUNNEL_ID=$(echo "$OUTPUT" | grep -oP '[a-f0-9-]{36}' | head -1)
    if [ -n "$TUNNEL_ID" ]; then
      ln -sf "$HOME/.cloudflared/$TUNNEL_ID.json" "$HOME/.cloudflared/hungarian-bites.json"
      echo "Credentials linked to: ~/.cloudflared/hungarian-bites.json"
    fi
    echo ""
    echo "Step 6: Route DNS"
    echo "Running: cloudflared tunnel route dns hungarian-bites hungarianbites.co.ke..."
    $CLOUDFLARED tunnel route dns hungarian-bites hungarianbites.co.ke
    echo ""
    echo "Step 7: Start tunnel"
    cd "$(dirname "$0")/.." && docker compose up -d cloudflared
    echo ""
    echo "=============================================="
    echo "Setup complete!"
    echo "Visit https://hungarianbites.co.ke after DNS propagates"
    echo "=============================================="
    ;;
  status)
    echo "=== Tunnel Container ==="
    docker ps --filter name=hungarian-bites-tunnel --format "table {{.Names}}\t{{.Status}}"
    echo ""
    echo "=== Credentials ==="
    ls -la ~/.cloudflared/ 2>/dev/null | grep -v "^total" | head -5
    echo ""
    echo "=== Tunnel Config ==="
    cat "$CONFIG_DIR/tunnel.yml" 2>/dev/null
    ;;
  restart)
    cd "$(dirname "$0")/.." && docker compose restart cloudflared
    ;;
  logs)
    docker logs -f hungarian-bites-tunnel
    ;;
  stop)
    cd "$(dirname "$0")/.." && docker compose stop cloudflared
    ;;
  *)
    echo "Usage: $0 [setup|status|restart|logs|stop]"
    ;;
esac
