# Resource Scheduler - Shell Functions
# Add these functions to your shell configuration for global access

# Function to start the Resource Scheduler servers
start() {
    if [ -f "./start" ]; then
        ./start start
    else
        echo "❌ Error: start script not found. Make sure you're in the Resource Scheduler directory."
        return 1
    fi
}

# Function to restart the Resource Scheduler servers
restart() {
    if [ -f "./start" ]; then
        ./start restart
    else
        echo "❌ Error: start script not found. Make sure you're in the Resource Scheduler directory."
        return 1
    fi
}

# Function to stop the Resource Scheduler servers
stop() {
    if [ -f "./start" ]; then
        ./start stop
    else
        echo "❌ Error: start script not found. Make sure you're in the Resource Scheduler directory."
        return 1
    fi
}

# Function to show help
resource-scheduler-help() {
    echo "Resource Scheduler - Available Commands"
    echo ""
    echo "  start     - Start both backend and frontend servers"
    echo "  restart   - Restart both servers"
    echo "  stop      - Stop both servers"
    echo "  help      - Show this help message"
    echo ""
    echo "Make sure you're in the Resource Scheduler directory when using these commands."
}

# Export functions so they're available in subshells
export -f start
export -f restart
export -f stop
export -f resource-scheduler-help 