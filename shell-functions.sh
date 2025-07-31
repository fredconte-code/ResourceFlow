# ResourceFlow - Shell Functions
# Add these functions to your shell configuration for global access

# Function to start the ResourceFlow servers
start() {
    if [ -f "./start" ]; then
        ./start start
    else
        echo "❌ Error: start script not found. Make sure you're in the ResourceFlow directory."
        return 1
    fi
}

# Function to restart the ResourceFlow servers
restart() {
    if [ -f "./start" ]; then
        ./start restart
    else
        echo "❌ Error: start script not found. Make sure you're in the ResourceFlow directory."
        return 1
    fi
}

# Function to stop the ResourceFlow servers
stop() {
    if [ -f "./start" ]; then
        ./start stop
    else
        echo "❌ Error: start script not found. Make sure you're in the ResourceFlow directory."
        return 1
    fi
}

# Function to show help
resourceflow-help() {
    echo "ResourceFlow - Available Commands"
    echo ""
    echo "  start     - Start both backend and frontend servers"
    echo "  restart   - Restart both servers"
    echo "  stop      - Stop both servers"
    echo "  help      - Show this help message"
    echo ""
    echo "Make sure you're in the ResourceFlow directory when using these commands."
}

# Export functions so they're available in subshells
export -f start
export -f restart
export -f stop
export -f resourceflow-help 