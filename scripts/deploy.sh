#!/bin/bash
# deploy.sh - Deployment script for Seasonal Seiyuu on VPS
# Usage: ./deploy.sh [path_to_new_jar]
# If no jar path provided, it defaults to 'seasonal-seiyuu-1.0.0.jar' in current directory.

# --- Configuration ---
SERVICE_NAME="seasonal-seiyuu"
TARGET_DIR="/opt/seasonal-seiyuu"
JAR_NAME="seasonal-seiyuu-1.0.0.jar"
USER="www-data"
GROUP="www-data"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root or using sudo"
  exit 1
fi

# Determine source JAR
SOURCE_JAR="${1:-$JAR_NAME}"

echo "=== Seasonal Seiyuu Deployment ==="

if [ -f "$SOURCE_JAR" ]; then
    echo "Found new JAR: $SOURCE_JAR"
    echo "Stopping service..."
    systemctl stop $SERVICE_NAME
    

    
    echo "Installing new JAR..."
    cp "$SOURCE_JAR" "$TARGET_DIR/$JAR_NAME"
    
    echo "Setting permissions..."
    chown $USER:$GROUP "$TARGET_DIR/$JAR_NAME"
    chmod 644 "$TARGET_DIR/$JAR_NAME"
    
    echo "Starting service..."
    systemctl start $SERVICE_NAME
    echo "Service started."
else
    echo "New JAR ($SOURCE_JAR) not found in current directory."
    echo "Restarting existing service only..."
    systemctl restart $SERVICE_NAME
fi

# Verify status
echo "=== Service Status ==="
systemctl status $SERVICE_NAME --no-pager

echo ""
echo "=== Tailing Logs (Ctrl+C to exit) ==="
journalctl -u $SERVICE_NAME -f
