#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Setting up Nginx as a reverse proxy with SSL/HTTPS ===${NC}"

# Check if script is run with root privileges
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}This script must be run as root or with sudo.${NC}"
    exit 1
fi

# Get domain name
if [ -z "$1" ]; then
    echo -e "${YELLOW}Please enter your domain name (e.g., example.com):${NC}"
    read DOMAIN_NAME
else
    DOMAIN_NAME=$1
fi

# Get email for Let's Encrypt
if [ -z "$2" ]; then
    echo -e "${YELLOW}Please enter your email for Let's Encrypt notifications:${NC}"
    read EMAIL
else
    EMAIL=$2
fi

# Install Nginx and Certbot
echo -e "${YELLOW}Installing Nginx and Certbot...${NC}"
apt update
apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
echo -e "${YELLOW}Creating Nginx configuration for ${DOMAIN_NAME}...${NC}"
cat > /etc/nginx/sites-available/${DOMAIN_NAME} << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
echo -e "${YELLOW}Enabling Nginx site...${NC}"
ln -sf /etc/nginx/sites-available/${DOMAIN_NAME} /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Open HTTP and HTTPS ports in firewall
echo -e "${YELLOW}Updating firewall rules...${NC}"
ufw allow 80/tcp
ufw allow 443/tcp

# Obtain SSL certificate
echo -e "${YELLOW}Obtaining SSL certificate from Let's Encrypt...${NC}"
certbot --nginx --non-interactive --agree-tos --email ${EMAIL} -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME}

# Set up auto-renewal
echo -e "${YELLOW}Setting up automatic certificate renewal...${NC}"
systemctl enable certbot.timer
systemctl start certbot.timer

# Show final message
echo -e "${GREEN}=== Nginx setup with SSL completed! ===${NC}"
echo -e "${GREEN}Your application is now accessible securely at:${NC}"
echo -e "${GREEN}https://${DOMAIN_NAME}${NC}"
echo -e "${YELLOW}SSL certificates will be automatically renewed.${NC}" 