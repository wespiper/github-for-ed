#!/bin/bash
# Script to stop MongoDB

echo "Stopping MongoDB..."

# Find and kill mongod process
MONGOD_PID=$(pgrep -x "mongod")

if [ -z "$MONGOD_PID" ]; then
    echo "❌ MongoDB is not running"
    exit 0
fi

kill $MONGOD_PID

if [ $? -eq 0 ]; then
    echo "✅ MongoDB stopped successfully"
else
    echo "❌ Failed to stop MongoDB"
    exit 1
fi