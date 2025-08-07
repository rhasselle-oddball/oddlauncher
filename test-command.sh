#!/bin/bash

# Test script for your specific yarn command
echo "=== Testing Your Exact Command ==="
echo "Command: yarn watch --env entry=10210-ja y-witness-statement"
echo "Working Directory: /home/robert/dev/vets-website"
echo ""

# Check if directory exists
if [ ! -d "/home/robert/dev/vets-website" ]; then
    echo "❌ ERROR: Directory /home/robert/dev/vets-website does not exist"
    echo "Available directories in /home/robert/dev/:"
    ls -la /home/robert/dev/ 2>/dev/null || echo "Cannot access /home/robert/dev/"
    exit 1
fi

echo "✅ Directory exists"

# Check if package.json exists
if [ ! -f "/home/robert/dev/vets-website/package.json" ]; then
    echo "❌ ERROR: No package.json found in /home/robert/dev/vets-website"
    exit 1
fi

echo "✅ package.json exists"

# Check yarn availability
if ! command -v yarn &> /dev/null; then
    echo "❌ ERROR: yarn command not found"
    exit 1
fi

echo "✅ yarn is available: $(which yarn)"
echo "✅ yarn version: $(yarn --version)"

# Test the command
echo ""
echo "=== Running Command (will timeout after 10 seconds) ==="
cd /home/robert/dev/vets-website

# Run with timeout to prevent hanging
timeout 10s yarn watch --env entry=10210-ja y-witness-statement &
PID=$!

echo "Process started with PID: $PID"
sleep 5
echo "Checking if process is still running..."

if kill -0 $PID 2>/dev/null; then
    echo "✅ SUCCESS: Process is running successfully"
    echo "Killing process..."
    kill $PID
    wait $PID 2>/dev/null
else
    echo "❌ Process terminated unexpectedly"
fi

echo ""
echo "=== Test Complete ==="
