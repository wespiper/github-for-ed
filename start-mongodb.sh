#!/bin/bash
# Script to start MongoDB locally for development

echo "Starting MongoDB..."

# Check if MongoDB is already running
if pgrep -x "mongod" > /dev/null; then
    echo "✅ MongoDB is already running"
    exit 0
fi

# Start MongoDB
./mongodb-macos-x86_64-7.0.0/bin/mongod \
    --dbpath ./mongodb-data \
    --port 27017 \
    --logpath ./mongodb.log \
    --fork

if [ $? -eq 0 ]; then
    echo "✅ MongoDB started successfully"
    echo "📊 Data directory: ./mongodb-data"
    echo "📋 Log file: ./mongodb.log"
    echo "🔌 Port: 27017"
else
    echo "❌ Failed to start MongoDB"
    exit 1
fi