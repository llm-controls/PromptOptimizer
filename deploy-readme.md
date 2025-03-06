# Deployment Guide for Contabo VPS

This guide explains how to deploy this application on a Contabo VPS easily with a single command.

## Prerequisites

- A Contabo VPS with SSH access (IP: 94.72.120.28)
- Git installed on the VPS

## Quick Start (Single Command Setup)

For a complete server setup including security configuration and automatic health checks:

1. Connect to your Contabo VPS via SSH:
   ```bash
   ssh username@94.72.120.28
   ```

2. Clone the repository:
   ```bash
   git clone https://your-repository-url.git
   cd your-repository-name
   ```

3. Make the setup script executable:
   ```bash
   chmod +x setup-server.sh
   ```

4. Run the setup script:
   ```bash
   ./setup-server.sh
   ```

This script will:
- Update your system packages
- Install and configure security tools (UFW firewall and Fail2ban)
- Configure automatic security updates
- Set up automatic health checks every 30 minutes
- Deploy your application

## Available Scripts

### 1. `setup-server.sh`
Complete server setup including security, automatic updates, and application deployment.

### 2. `deploy.sh`
Handles just the application deployment:
- Installs Docker and Docker Compose if not already installed
- Creates or checks for the `.env` file
- Builds and starts the application using Docker Compose
- Shows you the URL where your application is running

### 3. `health-check.sh`
Monitors the health of your application:
- Checks if Docker is running
- Verifies if the application container is up
- Tests if the application is responding to HTTP requests
- Shows resource usage statistics

## Manual Deployment Steps

If you prefer to deploy manually without the setup script:

1. Make the deployment script executable:
   ```bash
   chmod +x deploy.sh
   ```

2. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

## Configuration

When you run the deploy script for the first time, it will either:
- Use your existing `.env` file if it exists
- Create a new `.env` file from `.env.example` if available
- Create a basic `.env` file with default values

You will be prompted to edit the `.env` file to add your own API keys and configuration.

## Accessing Your Application

Once deployed, your application will be accessible at:
```
http://94.72.120.28:5000
```

## Troubleshooting

If you encounter permission issues with Docker, you might need to:
1. Log out and log back in after Docker installation
2. Run the deployment with sudo:
   ```bash
   sudo ./deploy.sh
   ```

## Monitoring and Management

- To view logs: `docker-compose logs -f`
- To stop the application: `docker-compose down`
- To restart the application: `docker-compose up -d --build prod`
- To check application health: `./health-check.sh`

## Security Considerations

The setup script configures:
- UFW firewall (allowing only SSH and port 5000)
- Fail2ban to protect against brute force attacks
- Automatic security updates

For production use, consider:
- Setting up HTTPS with a reverse proxy like Nginx
- Using Docker secrets or a vault service for sensitive credentials
- Implementing rate limiting for API endpoints

## Updating Your Application

To update your application after making changes to the repository:

1. Pull the latest changes:
   ```bash
   git pull
   ```

2. Run the deployment script again:
   ```bash
   ./deploy.sh
   ``` 