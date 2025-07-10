# Network Access Guide

## Application Access from IP Address

Your Report Logger application is now configured to be accessible from the network IP address **192.168.68.113**.

### Access URLs
- **Frontend (Web Interface)**: http://192.168.68.113:4173
- **Backend API**: http://192.168.68.113:3001

### Network Configuration
✅ **Backend**: Configured to listen on all interfaces (0.0.0.0:3001)  
✅ **Frontend**: Configured to serve on all interfaces (0.0.0.0:4173)  
✅ **CORS**: Configured to allow access from the IP address  
✅ **Firewall**: Ports 3001 and 4173 are open  

### How to Access

#### From the Same Network
1. Open a web browser on any device connected to the same network
2. Navigate to: `http://192.168.68.113:4173`
3. You should see the Report Logger login page

#### From Different Networks
If you need to access from outside the local network:
1. Configure port forwarding on your router for ports 3001 and 4173
2. Use your public IP address instead of 192.168.68.113
3. Ensure your ISP allows incoming connections on these ports

### Testing Network Access

#### Test Backend API
```bash
curl http://192.168.68.113:3001/reports
```

#### Test Frontend
```bash
curl http://192.168.68.113:4173
```

### Troubleshooting

#### If you can't access from other devices:

1. **Check Firewall**:
   ```bash
   sudo ufw status
   ```

2. **Check if services are listening**:
   ```bash
   netstat -tlnp | grep -E ':(3001|4173)'
   ```

3. **Check PM2 status**:
   ```bash
   ./manage-app.sh status
   ```

4. **Restart applications**:
   ```bash
   ./manage-app.sh restart
   ```

#### Common Issues:

- **Connection refused**: Check if applications are running
- **Timeout**: Check firewall settings
- **CORS errors**: Check browser console for cross-origin issues

### Security Considerations

⚠️ **Important**: The application is currently accessible to anyone on the network. For production use:

1. **Add Authentication**: Ensure login is required
2. **Use HTTPS**: Configure SSL certificates
3. **Restrict Access**: Use VPN or specific IP whitelisting
4. **Regular Updates**: Keep the application updated

### Management Commands

```bash
# Check status
./manage-app.sh status

# View logs
./manage-app.sh logs

# Restart applications
./manage-app.sh restart

# Rebuild frontend
./manage-app.sh rebuild
```

### Network Ports Used

- **Port 3001**: Backend API (Express.js)
- **Port 4173**: Frontend (Vite preview server)
- **Port 3306**: MySQL Database (already configured)

All ports are configured to accept connections from any IP address on the network. 