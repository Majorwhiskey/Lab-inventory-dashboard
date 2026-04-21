#!/usr/bin/env bash
set -euo pipefail

# Plug-and-play Raspberry Pi setup for Lab Inventory
# Usage:
#   chmod +x setup_pi.sh
#   ./setup_pi.sh
#
# Optional env overrides:
#   PORT=4000 ./setup_pi.sh

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${PROJECT_DIR}/backend"
FRONTEND_DIR="${PROJECT_DIR}/frontend"
PORT="${PORT:-4000}"

if [[ ! -d "${BACKEND_DIR}" || ! -d "${FRONTEND_DIR}" ]]; then
  echo "Error: run this script from the project root (contains backend/ and frontend/)."
  exit 1
fi

echo "==> Detecting Raspberry Pi LAN IP"
PI_IP="$(hostname -I | awk '{print $1}')"
if [[ -z "${PI_IP}" ]]; then
  echo "Error: could not detect LAN IP."
  exit 1
fi
echo "Detected IP: ${PI_IP}"

echo "==> Installing Node.js 18 (if needed)"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "==> Installing project dependencies"
npm --prefix "${BACKEND_DIR}" install
npm --prefix "${FRONTEND_DIR}" install

echo "==> Writing environment files"
cat > "${BACKEND_DIR}/.env" <<EOF
PORT=${PORT}
CLIENT_URL=http://${PI_IP}:${PORT}
EOF

cat > "${FRONTEND_DIR}/.env" <<EOF
VITE_API_URL=http://${PI_IP}:${PORT}/api
VITE_SOCKET_URL=http://${PI_IP}:${PORT}
EOF

echo "==> Building frontend"
npm --prefix "${FRONTEND_DIR}" run build

echo "==> Installing PM2"
if ! command -v pm2 >/dev/null 2>&1; then
  sudo npm install -g pm2
fi

echo "==> Starting backend with PM2"
pm2 delete lab-inventory >/dev/null 2>&1 || true
pm2 start "${BACKEND_DIR}/src/server.js" --name lab-inventory
pm2 save

echo "==> Enabling PM2 on boot"
sudo env PATH="$PATH" pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || true

echo
echo "Setup complete."
echo "Dashboard URL: http://${PI_IP}:${PORT}"
echo "PM2 status:"
pm2 status
