#!/usr/bin/env bash
# Pushes homeassistant/scripts and homeassistant/automations to the Pi, where the
# container mounts them read-only as /config/scripts and /config/automations.
# The Pi's address and key stay out of Git: set PI_HOST (user@address) and PI_KEY.
set -euo pipefail

: "${PI_HOST:?set PI_HOST, e.g. user@address}"
: "${PI_KEY:?set PI_KEY to the SSH key path}"

root="$(cd "$(dirname "$0")/.." && pwd)/homeassistant"
ssh_opts=(-i "$PI_KEY" -o BatchMode=yes)

# Clear the old files first so a file removed from the repo disappears from the Pi too.
ssh "${ssh_opts[@]}" "$PI_HOST" 'rm -f ~/ha-sync/scripts/*.yaml ~/ha-sync/automations/*.yaml'
scp -q "${ssh_opts[@]}" "$root"/scripts/*.yaml "$PI_HOST:ha-sync/scripts/"
scp -q "${ssh_opts[@]}" "$root"/automations/*.yaml "$PI_HOST:ha-sync/automations/"

# Home Assistant reads the files at start; there is no HA token here, so restart the container.
ssh "${ssh_opts[@]}" "$PI_HOST" 'docker restart homeassistant >/dev/null && echo "homeassistant restarted"'
