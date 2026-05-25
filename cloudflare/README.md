# Cloudflare Tunnel Setup

The server is behind a home router NAT (`192.168.1.107`).
Cloudflare Tunnel provides public HTTPS access without port forwarding.

## Prerequisites

1. Sign up at https://cloudflare.com (Free plan)
2. Change your domain nameservers to Cloudflare's (at your .co.ke registrar)
3. Wait for DNS to propagate

## Setup

```bash
./scripts/tunnel.sh setup
```

This guides you through:
- `cloudflared tunnel login` (opens browser)
- `cloudflared tunnel create hungarian-bites`
- `cloudflared tunnel route dns hungarian-bites hungarianbites.co.ke`
- Starts the tunnel Docker container

## Management

```bash
./scripts/tunnel.sh status   # Check tunnel status
./scripts/tunnel.sh logs     # View tunnel logs
./scripts/tunnel.sh restart  # Restart tunnel
./scripts/tunnel.sh stop     # Stop tunnel
```

## Architecture

```
https://hungarianbites.co.ke
        ↓
  Cloudflare Edge (HTTPS, CDN, DDoS)
        ↓
  Cloudflare Tunnel (outbound from server)
        ↓
  localhost:8080 (pm2 frontend → /api/* → :3000)
```
