# Meta Prompt Arena

An application for creating, evaluating, and optimizing AI system prompts with a visual workflow.

## Overview

Meta Prompt Arena helps you:

1. Create system prompts from simple descriptions
2. Generate variations of your system prompts
3. Create test cases to evaluate prompt performance
4. Run evaluations to find the best performing prompts
5. Compare different AI models with your prompts

## Getting Started with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- API keys for the AI providers you want to use (OpenAI, Anthropic, etc.)

### Environment Setup

1. Copy the example environment file:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file to add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

### Development Mode

To run the application in development mode with hot reloading:

```bash
docker-compose up dev
```

The application will be available at http://localhost:3000

### Production Mode

To run the application in production mode:

```bash
docker-compose up prod
```

### Building the Docker Image

If you need to build the Docker image separately:

```bash
# Build the development image
docker build --target development -t meta-prompt-arena:dev .

# Build the production image
docker build --target production -t meta-prompt-arena:prod .
```

## Usage Guide

1. **Base Prompt**: Start by entering a simple description of the AI assistant you want to create
2. **Meta Prompt**: Generate a detailed system prompt from your base prompt
3. **Variations**: Create different versions of your system prompt to compare
4. **Test Cases**: Generate test scenarios to evaluate your prompts
5. **Evaluation**: Run tests to evaluate how each prompt variation performs
6. **Results**: View detailed results of the evaluation
7. **Model Arena**: Compare how different AI models perform with your prompts

## Troubleshooting

If you encounter issues:

1. Check the console logs for errors
2. Ensure your API keys are correctly set in the .env file
3. Make sure Docker is running with sufficient resources
4. Try restarting the containers: `docker-compose restart`

## Development Notes

- The application uses React for the frontend and Express for the backend
- State management is handled with Zustand
- The workflow is built with Reactflow for the visual graph interface
- The application makes API calls to various AI providers (OpenAI, Anthropic, etc.)

## License

MIT 