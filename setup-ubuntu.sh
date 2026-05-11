#!/bin/bash
# ─────────────────────────────────────────────────────────────────
#  Qualitia User Journey Map — Ubuntu 24.04 Setup Script
#  Run as a regular user with sudo access:
#    bash setup-ubuntu.sh
# ─────────────────────────────────────────────────────────────────

set -e

APP_DIR="/opt/qualitia-userjourney"
SERVICE_NAME="qualitia"
PORT=3001
REPO="https://github.com/mkm-qual/qualitia-userjourney.git"
NODE_VERSION="20"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[✔]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1"; }
section() { echo -e "\n${YELLOW}━━━ $1 ━━━${NC}"; }

# ── 1. Node.js ────────────────────────────────────────────────────
section "Installing Node.js $NODE_VERSION"
if ! node --version 2>/dev/null | grep -q "^v$NODE_VERSION"; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
info "Node $(node --version)  |  npm $(npm --version)"

# ── 2. Git ────────────────────────────────────────────────────────
section "Ensuring git is installed"
sudo apt-get install -y git curl
info "git $(git --version)"

# ── 3. Clone / update repo ────────────────────────────────────────
section "Setting up application"
if [ -d "$APP_DIR/.git" ]; then
  warn "Directory exists — pulling latest changes"
  sudo git -C "$APP_DIR" pull
else
  sudo git clone "$REPO" "$APP_DIR"
fi
sudo chown -R "$USER:$USER" "$APP_DIR"
info "Source at $APP_DIR"

# ── 4. Install dependencies & build ──────────────────────────────
section "Installing dependencies & building frontend"
cd "$APP_DIR"
npm install
npm run build
info "Build complete"

# ── 5. Data directory ─────────────────────────────────────────────
section "Preparing data directory"
mkdir -p "$APP_DIR/data"
info "Data will be stored at $APP_DIR/data"

# ── 6. Systemd service ────────────────────────────────────────────
section "Creating systemd service"

sudo tee /etc/systemd/system/${SERVICE_NAME}.service > /dev/null <<EOF
[Unit]
Description=Qualitia User Journey Map
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=$(which node) server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=DB_DIR=$APP_DIR
Environment=JWT_SECRET=$(openssl rand -hex 32)

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"
sleep 2

if systemctl is-active --quiet "$SERVICE_NAME"; then
  info "Service '$SERVICE_NAME' is running"
else
  echo -e "${RED}[✘]${NC} Service failed to start. Check: sudo journalctl -u $SERVICE_NAME -n 30"
  exit 1
fi

# ── 7. Firewall ───────────────────────────────────────────────────
section "Configuring firewall"
if command -v ufw &>/dev/null; then
  sudo ufw allow $PORT/tcp comment "Qualitia Journey Map" 2>/dev/null || true
  info "UFW rule added for port $PORT"
else
  warn "ufw not found — make sure port $PORT is open in your VM settings"
fi

# ── 8. Done ───────────────────────────────────────────────────────
VM_IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅  Qualitia Journey Map is live!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  🌐  From this VM :  http://localhost:$PORT"
echo -e "  🌐  From your Mac:  http://${VM_IP}:$PORT"
echo ""
echo -e "  🔑  Default login:  admin / Admin@123"
echo -e "  ⚠️   Change the admin password after first login!"
echo ""
echo -e "  📋  Useful commands:"
echo -e "      sudo systemctl status $SERVICE_NAME      # check status"
echo -e "      sudo systemctl restart $SERVICE_NAME     # restart"
echo -e "      sudo journalctl -u $SERVICE_NAME -f      # live logs"
echo ""
