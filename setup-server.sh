#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Setting up server security and automatic health checks ===${NC}"

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install basic security tools
echo -e "${YELLOW}Installing security tools...${NC}"
sudo apt install -y ufw fail2ban

# Configure firewall
echo -e "${YELLOW}Configuring firewall...${NC}"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 5000/tcp
sudo ufw --force enable
echo -e "${GREEN}Firewall configured and enabled.${NC}"

# Configure fail2ban
echo -e "${YELLOW}Configuring fail2ban...${NC}"
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
echo -e "${GREEN}Fail2ban configured and started.${NC}"

# Make script files executable
chmod +x deploy.sh
chmod +x health-check.sh

# Setup automatic health checks
echo -e "${YELLOW}Setting up automatic health checks...${NC}"
CRON_JOB="*/30 * * * * $(pwd)/health-check.sh >> $(pwd)/health-check.log 2>&1"

# Check if cron job already exists
if (crontab -l 2>/dev/null | grep -q "health-check.sh"); then
    echo -e "${YELLOW}Health check cron job already exists.${NC}"
else
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo -e "${GREEN}Automatic health check scheduled every 30 minutes.${NC}"
fi

# Setup automatic server updates
echo -e "${YELLOW}Setting up automatic security updates...${NC}"
sudo apt install -y unattended-upgrades apt-listchanges
sudo dpkg-reconfigure -plow unattended-upgrades
echo -e "${GREEN}Automatic security updates configured.${NC}"

# Run initial deployment
echo -e "${YELLOW}Running initial deployment...${NC}"
./deploy.sh

echo -e "${GREEN}=== Server setup completed! ===${NC}"
echo -e "${GREEN}Your application should be running at http://94.72.120.28:5000${NC}"
echo -e "${YELLOW}Health checks will run every 30 minutes and log to $(pwd)/health-check.log${NC}" 