#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Starting deployment process ===${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker installed successfully!${NC}"
    echo -e "${YELLOW}You may need to log out and back in for docker group changes to take effect.${NC}"
    echo -e "${YELLOW}If you encounter permission issues, run 'sudo docker-compose up -d' instead.${NC}"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Installing Docker Compose...${NC}"
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose installed successfully!${NC}"
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}.env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit the .env file with your actual configuration values.${NC}"
        echo -e "${YELLOW}Press Enter to continue after editing...${NC}"
        read
    else
        echo -e "${RED}.env.example file not found. Creating a basic .env file...${NC}"
        cat > .env << EOF
# API Keys for AI Providers
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Database Connection (if using)
DATABASE_URL=your_database_connection_string

# Application Settings
NODE_ENV=production
PORT=5000

# Set to 'true' to use mock responses for testing without API calls
MOCK_API=false
EOF
        echo -e "${YELLOW}A basic .env file has been created.${NC}"
        echo -e "${YELLOW}Please edit the .env file with your actual configuration values.${NC}"
        echo -e "${YELLOW}Press Enter to continue after editing...${NC}"
        read
    fi
fi

# Deploy with Docker Compose
echo -e "${GREEN}Building and starting the application in production mode...${NC}"
docker-compose up -d --build prod

# Check if the service is running
if [ $? -eq 0 ]; then
    echo -e "${GREEN}=== Deployment completed successfully! ===${NC}"
    echo -e "${GREEN}The application is now running at http://localhost:5000${NC}"
    echo -e "${YELLOW}You may need to configure your firewall to allow incoming connections on port 5000.${NC}"
    echo -e "${YELLOW}For example: 'sudo ufw allow 5000/tcp'${NC}"
    
    echo -e "${GREEN}Your application should be accessible at: http://94.72.120.28:5000${NC}"
else
    echo -e "${RED}Deployment failed. Please check the error messages above.${NC}"
fi

# Show logs
echo -e "${YELLOW}Showing logs (press Ctrl+C to exit logs):${NC}"
docker-compose logs -f 