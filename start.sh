#!/bin/bash
cd "$(dirname "$0")/backend"
echo "Starting Varaha Inventory Server..."
echo "Access at http://$(hostname -I | awk '{print $1}'):4000"
node src/server.js
