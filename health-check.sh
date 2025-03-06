#!/bin/bash

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Performing health check on the application...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Docker is not running.${NC}"
    echo -e "${YELLOW}Trying to start Docker...${NC}"
    sudo systemctl start docker
    sleep 5
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}Failed to start Docker. Please check Docker installation.${NC}"
        exit 1
    else
        echo -e "${GREEN}Docker started successfully.${NC}"
    fi
fi

# Check if the application container is running
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${RED}Application container is not running.${NC}"
    echo -e "${YELLOW}Trying to start the application...${NC}"
    docker-compose up -d --build prod
    sleep 10
    if ! docker-compose ps | grep -q "Up"; then
        echo -e "${RED}Failed to start the application. Please check the logs.${NC}"
        docker-compose logs
        exit 1
    else
        echo -e "${GREEN}Application started successfully.${NC}"
    fi
else
    echo -e "${GREEN}Application container is running.${NC}"
fi

# Get the port from docker-compose.yml or use default 5000
PORT=$(grep -oP "- \"\K[^:]+(?=:5000\")" docker-compose.yml || echo "5000")

# Check if the application is responding
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT} || echo "000")

if [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}Could not connect to the application.${NC}"
    echo -e "${YELLOW}Checking container logs...${NC}"
    docker-compose logs --tail=50
    exit 1
elif [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 400 ]; then
    echo -e "${GREEN}Application is up and running! HTTP status: ${HTTP_CODE}${NC}"
    echo -e "${GREEN}Application is accessible at: http://94.72.120.28:${PORT}${NC}"
    
    # Check resource usage
    echo -e "\n${YELLOW}Resource usage:${NC}"
    docker stats --no-stream $(docker-compose ps -q)
    
    exit 0
else
    echo -e "${RED}Application returned HTTP status: ${HTTP_CODE}${NC}"
    echo -e "${YELLOW}Checking container logs...${NC}"
    docker-compose logs --tail=50
    exit 1
fi 