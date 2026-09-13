#!/usr/bin/env bash
# serve.sh — local preview at http://localhost:8900
# Python's http.server is enough for the canvas frame flight (plain image GETs) —
# the engine blits pre-decoded <img> frames onto <canvas>, no <video> seeking,
# so no HTTP range support is required. Ported from shakur-remy-site/serve.sh.
set -euo pipefail
cd "$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-8900}"
echo "serving $(pwd) at http://localhost:$PORT  (Ctrl-C to stop)"
exec python3 -m http.server "$PORT"
