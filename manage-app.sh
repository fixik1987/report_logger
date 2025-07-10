#!/bin/bash

# Report Logger Application Management Script

case "$1" in
    start)
        echo "Starting Report Logger applications..."
        pm2 start ecosystem.config.cjs
        echo "Applications started!"
        ;;
    stop)
        echo "Stopping Report Logger applications..."
        pm2 stop report-logger-backend report-logger-frontend
        echo "Applications stopped!"
        ;;
    restart)
        echo "Restarting Report Logger applications..."
        pm2 restart report-logger-backend report-logger-frontend
        echo "Applications restarted!"
        ;;
    status)
        echo "Report Logger applications status:"
        pm2 status
        ;;
    logs)
        echo "Showing logs for Report Logger applications:"
        pm2 logs
        ;;
    backend-logs)
        echo "Showing backend logs:"
        pm2 logs report-logger-backend
        ;;
    frontend-logs)
        echo "Showing frontend logs:"
        pm2 logs report-logger-frontend
        ;;
    rebuild)
        echo "Rebuilding frontend..."
        npm run build
        echo "Restarting applications..."
        pm2 restart report-logger-frontend
        echo "Frontend rebuilt and restarted!"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|backend-logs|frontend-logs|rebuild}"
        echo ""
        echo "Commands:"
        echo "  start        - Start both backend and frontend"
        echo "  stop         - Stop both applications"
        echo "  restart      - Restart both applications"
        echo "  status       - Show current status"
        echo "  logs         - Show all logs"
        echo "  backend-logs - Show only backend logs"
        echo "  frontend-logs- Show only frontend logs"
        echo "  rebuild      - Rebuild frontend and restart"
        echo ""
        echo "Access URLs:"
        echo "  Frontend: http://192.168.68.113:4173"
        echo "  Backend:  http://192.168.68.113:3001"
        exit 1
        ;;
esac 