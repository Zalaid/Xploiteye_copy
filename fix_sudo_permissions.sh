#!/bin/bash

# XploitEye Backend - Fixed Sudo Permissions Setup Script
echo "🔧 XploitEye Backend - Fixing sudo permissions..."

# Check if user is in sudo group
if ! groups | grep -q sudo; then
    echo "❌ User $(whoami) is not in sudo group. Adding to sudo group..."
    echo "You may need to run: sudo usermod -aG sudo $(whoami)"
    echo "Then logout and login again."
fi

# Remove old sudoers file if it exists
if [ -f "/etc/sudoers.d/xploiteye-backend" ]; then
    echo "🗑️  Removing old sudoers configuration..."
    sudo rm -f /etc/sudoers.d/xploiteye-backend
fi

# Create new sudoers configuration with correct syntax
SUDOERS_FILE="/etc/sudoers.d/90-xploiteye-backend"
echo "📝 Creating new sudoers configuration..."

# Create the file with proper syntax
sudo tee "$SUDOERS_FILE" > /dev/null << 'EOF'
# XploitEye Backend - Passwordless sudo permissions
# User: kali

# Network scanning with nmap
kali ALL=(ALL) NOPASSWD: /usr/bin/nmap
kali ALL=(ALL) NOPASSWD: /usr/bin/nmap *

# Process management
kali ALL=(ALL) NOPASSWD: /usr/bin/pkill
kali ALL=(ALL) NOPASSWD: /usr/bin/pkill *

# VPN management
kali ALL=(ALL) NOPASSWD: /usr/sbin/openvpn
kali ALL=(ALL) NOPASSWD: /usr/sbin/openvpn *

# Network interface management
kali ALL=(ALL) NOPASSWD: /sbin/ip
kali ALL=(ALL) NOPASSWD: /sbin/ip *

# ARP scanning with arping
kali ALL=(ALL) NOPASSWD: /usr/sbin/arping
kali ALL=(ALL) NOPASSWD: /usr/sbin/arping *
kali ALL=(ALL) NOPASSWD: /usr/bin/arping
kali ALL=(ALL) NOPASSWD: /usr/bin/arping *
EOF

# Set correct permissions (440 = readable by owner and group only)
sudo chmod 440 "$SUDOERS_FILE"
sudo chown root:root "$SUDOERS_FILE"

# Validate syntax
echo "🔍 Validating sudoers syntax..."
if sudo visudo -c -f "$SUDOERS_FILE"; then
    echo "✅ Sudoers configuration is valid"
else
    echo "❌ Sudoers configuration is invalid - removing"
    sudo rm "$SUDOERS_FILE"
    exit 1
fi

# Test the configuration
echo "🧪 Testing sudo permissions..."

# Test nmap
if timeout 5 sudo -n nmap --version >/dev/null 2>&1; then
    echo "✅ nmap: passwordless sudo working"
else
    echo "❌ nmap: passwordless sudo NOT working"
fi

# Test pkill
if timeout 5 sudo -n pkill --version >/dev/null 2>&1; then
    echo "✅ pkill: passwordless sudo working"
else
    echo "❌ pkill: passwordless sudo NOT working"
fi

# Test openvpn
if timeout 5 sudo -n openvpn --version >/dev/null 2>&1; then
    echo "✅ openvpn: passwordless sudo working"
else
    echo "❌ openvpn: passwordless sudo NOT working"
fi

# Test ip
if timeout 5 sudo -n ip --version >/dev/null 2>&1; then
    echo "✅ ip: passwordless sudo working"
else
    echo "❌ ip: passwordless sudo NOT working"
fi

# Test arping
if timeout 5 sudo -n arping -h >/dev/null 2>&1; then
    echo "✅ arping: passwordless sudo working"
else
    echo "❌ arping: passwordless sudo NOT working"
fi

echo ""
echo "📁 Configuration file: $SUDOERS_FILE"
echo "📋 File permissions: $(ls -la $SUDOERS_FILE)"
echo ""
echo "🔄 If still not working, try:"
echo "   1. Logout and login again"
echo "   2. Restart your backend application"
echo "   3. Check: sudo -l | grep nmap"