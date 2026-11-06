#!/usr/bin/env bash
# Installs or updates the Pi probe on the Raspberry Pi. It runs as its own container
# (name: pi-probe) from the Home Assistant image that is already on the Pi, so nothing
# is pulled or installed and Home Assistant itself is not touched or restarted.
# The container restarts with Docker (also after a reboot). No sudo needed.
# The Pi's address and key stay out of Git: set PI_HOST (user@address) and PI_KEY.
set -euo pipefail

: "${PI_HOST:?set PI_HOST, e.g. user@address}"
: "${PI_KEY:?set PI_KEY to the SSH key path}"

here="$(cd "$(dirname "$0")" && pwd)"
ssh_opts=(-i "$PI_KEY" -o BatchMode=yes)

ssh "${ssh_opts[@]}" "$PI_HOST" 'mkdir -p ~/pi-probe'
scp -q "${ssh_opts[@]}" "$here/pi_probe.py" "$PI_HOST:pi-probe/pi_probe.py"

ssh "${ssh_opts[@]}" "$PI_HOST" 'docker rm -f pi-probe >/dev/null 2>&1 || true
docker run -d --name pi-probe --restart unless-stopped \
  --entrypoint python3 \
  -p 8788:8788 \
  -v "$HOME/pi-probe/pi_probe.py:/app/pi_probe.py:ro" \
  -v /:/hostroot:ro \
  ghcr.io/home-assistant/home-assistant:stable /app/pi_probe.py >/dev/null
echo "pi-probe started"'
