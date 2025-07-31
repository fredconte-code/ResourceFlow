# Resource Scheduler - Server Management

This document explains how to use the new server management functions that allow you to start and restart the application servers by typing simple commands.

## Quick Start

### Option 1: One-time Setup (Recommended)

1. Run the setup script to add the functions to your shell:
   ```bash
   ./setup-shell.sh
   ```

2. Reload your shell configuration:
   ```bash
   source ~/.zshrc  # or ~/.bashrc for bash
   ```

3. Now you can use the commands from anywhere:
   ```bash
   start     # Start the servers
   restart   # Restart the servers
   stop      # Stop the servers
   ```

### Option 2: Manual Usage

If you prefer not to set up global functions, you can use the start script directly:

```bash
./start start     # Start servers
./start restart   # Restart servers
./start stop      # Stop servers
./start help      # Show help
```

## Available Commands

### `start`
- Starts both the backend (Node.js) and frontend (Vite) servers
- Automatically installs dependencies if needed
- Shows server URLs when started
- Checks if servers are already running

### `restart`
- Stops any running servers
- Waits for processes to fully stop
- Starts the servers fresh
- Useful for applying code changes

### `stop`
- Stops both backend and frontend servers
- Kills all related processes

## Server URLs

When the servers start successfully, you'll see:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## Troubleshooting

### "start script not found" Error
Make sure you're in the Resource Scheduler directory when using the commands.

### Port Already in Use
If you get port conflicts, use the `restart` command to stop and restart the servers.

### Dependencies Not Installed
The script will automatically install dependencies if `node_modules` doesn't exist.

### Shell Functions Not Working
1. Make sure you ran `./setup-shell.sh`
2. Reload your shell: `source ~/.zshrc` (or `~/.bashrc`)
3. Or restart your terminal

## Manual Installation

If the setup script doesn't work, you can manually add these lines to your shell configuration file (`~/.zshrc` or `~/.bashrc`):

```bash
# Resource Scheduler - Shell Functions
if [ -f "/path/to/your/Resource Scheduler/shell-functions.sh" ]; then
    source "/path/to/your/Resource Scheduler/shell-functions.sh"
fi
```

Replace `/path/to/your/Resource Scheduler/` with the actual path to your project directory.

## Files Created

- `start` - Main server management script
- `shell-functions.sh` - Shell functions for global access
- `setup-shell.sh` - Setup script for shell configuration
- `SERVER-MANAGEMENT.md` - This documentation file 