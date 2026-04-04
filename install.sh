#!/usr/bin/env bash
# ╔════════════════════════════════════════════════════════════╗
# ║          VOID Player — One-Click Install Script            ║
# ║    Supports Linux (deb/rpm/AppImage) and macOS (dmg)       ║
# ╚════════════════════════════════════════════════════════════╝
set -euo pipefail

REPO="anacondy/Void-player-"
RELEASES_URL="https://github.com/${REPO}/releases/latest"
INSTALL_DIR="${HOME}/.local/share/void-player"
BIN_DIR="${HOME}/.local/bin"
PWA_URL="https://anacondy.github.io/Void-player-/"

# ── Colour helpers ──────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}${BOLD}[VOID]${NC} $*"; }
success() { echo -e "${GREEN}${BOLD}[VOID]${NC} $*"; }
warn()    { echo -e "${YELLOW}${BOLD}[VOID]${NC} $*"; }
error()   { echo -e "${RED}${BOLD}[VOID ERROR]${NC} $*" >&2; exit 1; }

# ── Banner ───────────────────────────────────────────────────
echo -e "${CYAN}"
cat <<'EOF'
 ██╗   ██╗ ██████╗ ██╗██████╗
 ██║   ██║██╔═══██╗██║██╔══██╗
 ██║   ██║██║   ██║██║██║  ██║
 ╚██╗ ██╔╝██║   ██║██║██║  ██║
  ╚████╔╝ ╚██████╔╝██║██████╔╝
   ╚═══╝   ╚═════╝ ╚═╝╚═════╝
          P L A Y E R
EOF
echo -e "${NC}"

info "Detecting operating system..."
OS="$(uname -s)"
ARCH="$(uname -m)"

# ── Resolve latest release tag ───────────────────────────────
resolve_latest_tag() {
    if command -v curl &>/dev/null; then
        curl -fsSL -o /dev/null -w '%{url_effective}' "${RELEASES_URL}" \
            | grep -oP 'v[0-9]+\.[0-9]+\.[0-9]+$' || true
    elif command -v wget &>/dev/null; then
        wget -q --server-response --max-redirect=10 \
            "${RELEASES_URL}" 2>&1 \
            | grep -oP 'https://.*?/releases/tag/\K[^"]+' | tail -1 || true
    fi
}

TAG="$(resolve_latest_tag)"
if [[ -z "$TAG" ]]; then
    warn "Could not fetch latest release tag — falling back to PWA install."
    TAG="latest"
fi

BASE_URL="https://github.com/${REPO}/releases/download/${TAG}"
info "Latest release: ${BOLD}${TAG}${NC}"

# ── macOS install ─────────────────────────────────────────────
install_macos() {
    info "macOS detected (${ARCH})."
    local dmg_name="void-player_${TAG}_aarch64.dmg"
    if [[ "$ARCH" == "x86_64" ]]; then
        dmg_name="void-player_${TAG}_x64.dmg"
    fi
    local url="${BASE_URL}/${dmg_name}"
    local tmp="$(mktemp -d)"
    local dmg="${tmp}/${dmg_name}"

    info "Downloading ${dmg_name}..."
    if command -v curl &>/dev/null; then
        curl -fL --progress-bar -o "${dmg}" "${url}" || {
            warn "Desktop installer not found. Installing as PWA..."
            install_pwa_macos
            return
        }
    else
        wget -q --show-progress -O "${dmg}" "${url}" || {
            warn "Desktop installer not found. Installing as PWA..."
            install_pwa_macos
            return
        }
    fi

    info "Mounting DMG..."
    local mount_point="$(mktemp -d)"
    hdiutil attach "${dmg}" -mountpoint "${mount_point}" -quiet
    local app_src="$(find "${mount_point}" -name "*.app" -maxdepth 1 | head -1)"
    if [[ -n "$app_src" ]]; then
        info "Installing to /Applications/..."
        cp -r "${app_src}" /Applications/
        success "VOID Player installed to /Applications/."
    fi
    hdiutil detach "${mount_point}" -quiet
    rm -rf "${tmp}" "${mount_point}"
}

install_pwa_macos() {
    info "Opening VOID Player in your default browser for PWA install..."
    open "${PWA_URL}" 2>/dev/null || true
    echo ""
    warn "In Safari: tap the Share button → 'Add to Home Screen'"
    warn "In Chrome: click the install icon in the address bar"
}

# ── Linux install ─────────────────────────────────────────────
install_linux() {
    info "Linux detected (${ARCH})."

    # Prefer .deb on Debian/Ubuntu, .rpm on Fedora/RHEL, else AppImage
    if command -v dpkg &>/dev/null; then
        install_linux_deb
    elif command -v rpm &>/dev/null; then
        install_linux_rpm
    else
        install_linux_appimage
    fi
}

install_linux_deb() {
    local deb_name="void-player_${TAG}_amd64.deb"
    [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]] && deb_name="void-player_${TAG}_arm64.deb"
    local url="${BASE_URL}/${deb_name}"
    local tmp="$(mktemp -d)"
    local deb="${tmp}/${deb_name}"

    info "Downloading ${deb_name}..."
    if command -v curl &>/dev/null; then
        curl -fL --progress-bar -o "${deb}" "${url}" || { install_linux_appimage; return; }
    else
        wget -q --show-progress -O "${deb}" "${url}" || { install_linux_appimage; return; }
    fi

    info "Installing .deb package (sudo required)..."
    sudo dpkg -i "${deb}" || sudo apt-get install -f -y
    rm -rf "${tmp}"
    success "VOID Player installed. Launch from your application menu."
}

install_linux_rpm() {
    local rpm_name="void-player-${TAG}-1.x86_64.rpm"
    [[ "$ARCH" == "aarch64" ]] && rpm_name="void-player-${TAG}-1.aarch64.rpm"
    local url="${BASE_URL}/${rpm_name}"
    local tmp="$(mktemp -d)"
    local rpm="${tmp}/${rpm_name}"

    info "Downloading ${rpm_name}..."
    if command -v curl &>/dev/null; then
        curl -fL --progress-bar -o "${rpm}" "${url}" || { install_linux_appimage; return; }
    else
        wget -q --show-progress -O "${rpm}" "${url}" || { install_linux_appimage; return; }
    fi

    info "Installing .rpm package (sudo required)..."
    if command -v dnf &>/dev/null; then
        sudo dnf install -y "${rpm}"
    else
        sudo rpm -i "${rpm}"
    fi
    rm -rf "${tmp}"
    success "VOID Player installed. Launch from your application menu."
}

install_linux_appimage() {
    local appimage_name="void-player_${TAG}_amd64.AppImage"
    [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]] && appimage_name="void-player_${TAG}_aarch64.AppImage"
    local url="${BASE_URL}/${appimage_name}"
    mkdir -p "${INSTALL_DIR}" "${BIN_DIR}"
    local appimage="${INSTALL_DIR}/VoidPlayer.AppImage"

    info "Downloading AppImage..."
    if command -v curl &>/dev/null; then
        curl -fL --progress-bar -o "${appimage}" "${url}" || {
            warn "Desktop installer not available. Falling back to PWA."
            install_pwa_linux
            return
        }
    else
        wget -q --show-progress -O "${appimage}" "${url}" || {
            warn "Desktop installer not available. Falling back to PWA."
            install_pwa_linux
            return
        }
    fi

    chmod +x "${appimage}"

    # Create launcher symlink
    ln -sf "${appimage}" "${BIN_DIR}/void-player"

    # Create .desktop entry
    local desktop_dir="${HOME}/.local/share/applications"
    mkdir -p "${desktop_dir}"
    cat > "${desktop_dir}/void-player.desktop" <<DESKTOP
[Desktop Entry]
Name=VOID Player
Comment=Privacy-focused music player
Exec=${appimage} %U
Icon=${INSTALL_DIR}/icon.png
Terminal=false
Type=Application
Categories=AudioVideo;Audio;Player;
MimeType=audio/mpeg;audio/flac;audio/wav;audio/aac;audio/ogg;audio/opus;audio/webm;
DESKTOP

    update-desktop-database "${desktop_dir}" 2>/dev/null || true
    success "VOID Player installed to ${INSTALL_DIR}."
    info  "Run it with: ${BOLD}void-player${NC}  or from your application launcher."
}

install_pwa_linux() {
    info "Opening VOID Player in your default browser for PWA install..."
    if command -v xdg-open &>/dev/null; then
        xdg-open "${PWA_URL}" &
    elif command -v gio &>/dev/null; then
        gio open "${PWA_URL}" &
    fi
    echo ""
    warn "In Chrome/Edge: click the install icon (⊕) in the address bar"
    warn "In Firefox: install the 'Progressive Web Apps for Firefox' add-on"
}

# ── Main ──────────────────────────────────────────────────────
case "$OS" in
    Darwin) install_macos ;;
    Linux)  install_linux ;;
    *)
        warn "Unsupported OS: ${OS}."
        info "Please visit ${BOLD}${PWA_URL}${NC} to use the PWA version."
        info "For Windows, run: ${BOLD}irm https://raw.githubusercontent.com/${REPO}/main/install.ps1 | iex${NC}"
        exit 1
        ;;
esac

echo ""
success "Installation complete!"
info "Open ${BOLD}${PWA_URL}${NC} in any browser to use the PWA version."
info "Supported formats: MP3 · FLAC · WAV · AAC · M4A · OGG · OPUS · WebM"
