#!/bin/bash

# Debug script for Oddbox process issues
# This script helps debug common issues with starting processes

echo "=== Oddbox Process Debug Helper ==="
echo "Date: $(date)"
echo "OS: $(uname -a)"
echo ""

# Test command from user's configuration
COMMAND="yarn watch --env entry=10210-ja y-witness-statement"
WORKING_DIR="/home/robert/dev/vets-website"

echo "=== Testing User's Configuration ==="
echo "Command: $COMMAND"
echo "Working Directory: $WORKING_DIR"
echo ""

# Check if working directory exists
if [ -d "$WORKING_DIR" ]; then
    echo "✅ Working directory exists: $WORKING_DIR"
    
    # Check if it's accessible
    if [ -r "$WORKING_DIR" ] && [ -x "$WORKING_DIR" ]; then
        echo "✅ Working directory is readable and executable"
    else
        echo "❌ Working directory exists but has permission issues"
        ls -la "$WORKING_DIR/.."
    fi
    
    # List contents
    echo "📁 Working directory contents:"
    ls -la "$WORKING_DIR" | head -10
    
else
    echo "❌ Working directory does not exist: $WORKING_DIR"
    
    # Check if the Windows path might be the issue
    WSL_PATH="/mnt/c/Users/"
    if [[ "$WORKING_DIR" == \\\\wsl.localhost* ]]; then
        echo "🔍 Detected Windows WSL path format"
        echo "   This may need to be converted to Linux path format"
        echo "   Try using: /home/robert/dev/vets-website instead"
    fi
fi

echo ""

# Check if yarn is available
echo "=== Checking Command Dependencies ==="
if command -v yarn >/dev/null 2>&1; then
    echo "✅ yarn is available"
    echo "   Version: $(yarn --version)"
    echo "   Location: $(which yarn)"
else
    echo "❌ yarn command not found"
    echo "   Make sure yarn is installed and in your PATH"
fi

echo ""

# Check PATH
echo "=== Environment Information ==="
echo "PATH:"
echo "$PATH" | tr ':' '\n' | nl

echo ""
echo "Current working directory: $(pwd)"
echo "User: $(whoami)"
echo "Shell: $SHELL"

echo ""

# Test running the command if working directory exists and yarn is available
if [ -d "$WORKING_DIR" ] && command -v yarn >/dev/null 2>&1; then
    echo "=== Testing Command Execution ==="
    echo "Attempting to run command in working directory..."
    
    cd "$WORKING_DIR" || exit 1
    echo "Changed to directory: $(pwd)"
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        echo "✅ package.json found"
        
        # Check if the script exists
        if grep -q "watch" package.json; then
            echo "✅ 'watch' script found in package.json"
        else
            echo "❌ 'watch' script not found in package.json"
            echo "Available scripts:"
            grep -A 10 '"scripts"' package.json || echo "No scripts section found"
        fi
    else
        echo "❌ package.json not found in working directory"
    fi
    
    # Try to run with timeout to avoid hanging
    echo ""
    echo "Attempting to run command (with 10 second timeout)..."
    timeout 10 $COMMAND && echo "✅ Command executed successfully" || echo "❌ Command failed or timed out"
    
else
    echo "⏭️  Skipping command execution test (missing dependencies)"
fi

echo ""
echo "=== Debug Complete ==="
echo "If you're still having issues, check the debug information above."
echo "Common fixes:"
echo "1. Make sure the working directory path is correct (Linux format, not Windows)"
echo "2. Ensure yarn is installed and accessible"
echo "3. Verify the package.json has the required scripts"
echo "4. Check file permissions in the working directory"
