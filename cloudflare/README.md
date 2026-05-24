# Cloudflare Tunnel Setup

## Prerequisites
1. Sign up at https://cloudflare.com (Free plan)
2. Change your domain nameservers to Cloudflare's (at your .co.ke registrar)
3. DNS will auto-propagate within minutes

## Install cloudflared

```bash
# Download the binary
curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /tmp/cloudflared
chmod +x /tmp/cloudflared
sudo mv /tmp/cloudflared /usr/local/bin/cloudflared

# Or via Docker (pull might be slow — same network issue)
docker run cloudflare/cloudflared --version
```

## Setup Tunnel

```bash
# Authenticate (opens browser — do this on a machine with GUI)
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create hungarian-bites

# Configure DNS
cloudflared tunnel route dns hungarian-bites hungarianbites.co.ke

# Run tunnel
cloudflared tunnel run hungarian-bites --config /home/sodlex/dev/web/kenydee-hungarian-bites-api/cloudflare/tunnel.yml
```

## Run as a service (optional)
```bash
cloudflared service install
```

Once running, `https://hungarianbites.co.ke` will serve your app at `localhost:8080` with free SSL.
