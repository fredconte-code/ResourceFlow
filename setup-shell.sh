#!/bin/bash

# ResourceFlow - Shell Setup Script
# This script will add the necessary functions to your shell configuration

echo "🚀 Setting up ResourceFlow shell functions..."

# Determine the shell configuration file
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
    SHELL_NAME="zsh"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
    SHELL_NAME="bash"
else
    echo "❌ Unsupported shell. Please manually add the functions to your shell configuration."
    exit 1
fi

# Check if the shell config file exists
if [ ! -f "$SHELL_CONFIG" ]; then
    echo "📝 Creating $SHELL_CONFIG..."
    touch "$SHELL_CONFIG"
fi

# Check if the functions are already added
if grep -q "ResourceFlow - Shell Functions" "$SHELL_CONFIG"; then
    echo "✅ Shell functions are already configured in $SHELL_CONFIG"
    echo "You can now use 'start' and 'restart' commands in your terminal!"
else
    echo "📝 Adding shell functions to $SHELL_CONFIG..."
    
    # Add a comment and the source line
    cat >> "$SHELL_CONFIG" << EOF

# ResourceFlow - Shell Functions
# Source the shell functions for global access
if [ -f "$(pwd)/shell-functions.sh" ]; then
    source "$(pwd)/shell-functions.sh"
fi
EOF
    
    echo "✅ Shell functions added to $SHELL_CONFIG"
    echo ""
    echo "🔄 To activate the functions in your current session, run:"
    echo "   source $SHELL_CONFIG"
    echo ""
    echo "📝 Or restart your terminal to use the new commands:"
    echo "   start     - Start the servers"
    echo "   restart   - Restart the servers"
    echo "   stop      - Stop the servers"
fi

echo ""
echo "🎉 Setup complete! You can now use 'start' and 'restart' commands."
echo "Make sure you're in the ResourceFlow directory when using these commands." 