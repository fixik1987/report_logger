# Report Logger - Production Deployment Guide

## Overview
The Report Logger application is now configured to run continuously using PM2 process manager. The application consists of:
- **Backend**: Node.js/Express server running on port 3001
- **Frontend**: React/Vite application running on port 4173

## Current Status
✅ **Applications are running and configured for auto-start**

## Access URLs
- **Frontend**: http://192.168.68.113:4173
- **Backend API**: http://192.168.68.113:3001

## Management Commands

### Using the Management Script
```bash
# Check status
./manage-app.sh status

# View logs
./manage-app.sh logs

# Restart applications
./manage-app.sh restart

# Stop applications
./manage-app.sh stop

# Start applications
./manage-app.sh start

# Rebuild frontend (after code changes)
./manage-app.sh rebuild
```

### Using PM2 Directly
```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart all applications
pm2 restart all

# Stop all applications
pm2 stop all

# Start all applications
pm2 start all

# Monitor applications in real-time
pm2 monit
```

## Auto-Start Configuration
The applications are configured to automatically start when the server boots up. This is handled by:
1. PM2 startup script (already configured)
2. Saved process list (already saved)

## Log Files
Logs are stored in the following locations:
- Backend logs: `backend/logs/`
- Frontend logs: `logs/`
- PM2 logs: `~/.pm2/logs/`

## Troubleshooting

### If applications don't start automatically after reboot:
```bash
# Re-enable startup
pm2 startup
pm2 save
```

### If you need to update the frontend:
```bash
# Rebuild and restart
./manage-app.sh rebuild
```

### If you need to check specific logs:
```bash
# Backend only
./manage-app.sh backend-logs

# Frontend only
./manage-app.sh frontend-logs
```

### If PM2 is not working:
```bash
# Reinstall PM2
npm install -g pm2

# Restart PM2 daemon
pm2 kill
pm2 start ecosystem.config.cjs
```

## File Structure
```
report_logger/
├── ecosystem.config.cjs    # PM2 configuration
├── manage-app.sh          # Management script
├── backend/               # Backend application
│   ├── index.js          # Main server file
│   └── logs/             # Backend logs
├── dist/                 # Built frontend files
└── logs/                 # Frontend logs
```

## Security Notes
- The applications are running on localhost only
- For external access, configure a reverse proxy (nginx/apache)
- Consider setting up SSL certificates for production use
- Ensure firewall rules are properly configured

## Performance Monitoring
PM2 provides built-in monitoring:
```bash
# Real-time monitoring
pm2 monit

# Detailed status
pm2 show report-logger-backend
pm2 show report-logger-frontend
``` 