#!/usr/bin/env node

/**
 * This script tests the AI connection to help diagnose issues with the Meta Prompt Arena.
 * It directly makes an API call to the OpenAI API to verify that your credentials are working.
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

async function main() {
  console.log(`${colors.cyan}=== Meta Prompt Arena AI Connection Test ====${colors.reset}`);
  console.log(`This script will test your AI provider connection to help diagnose issues.\n`);

  // Try to load API key from .env
  let apiKey = '';
  let provider = '';
  try {
    if (fs.existsSync('.env')) {
      const envContent = fs.readFileSync('.env', 'utf8');
      
      // Check for OpenAI API key - updated pattern to handle spaces around equals
      const openaiMatch = envContent.match(/OPENAI_API_KEY\s*=\s*["']([^"']+)["']/);
      if (openaiMatch && openaiMatch[1]) {
        apiKey = openaiMatch[1];
        provider = 'openai';
        console.log(`${colors.green}✓ Found OpenAI API key in .env file${colors.reset}`);
      }
      
      // If no OpenAI key, try Anthropic - updated pattern to handle spaces around equals
      if (!apiKey) {
        const anthropicMatch = envContent.match(/ANTHROPIC_API_KEY\s*=\s*["']([^"']+)["']/);
        if (anthropicMatch && anthropicMatch[1]) {
          apiKey = anthropicMatch[1];
          provider = 'anthropic';
          console.log(`${colors.green}✓ Found Anthropic API key in .env file${colors.reset}`);
        }
      }
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠ Could not read .env file: ${error.message}${colors.reset}`);
  }

  // If no API key was found, ask for one
  if (!apiKey) {
    console.log(`${colors.yellow}⚠ No API key found in .env file${colors.reset}`);
    
    provider = await new Promise(resolve => {
      rl.question('Which AI provider would you like to test? (openai/anthropic): ', answer => {
        resolve(answer.toLowerCase().trim());
      });
    });
    
    if (provider !== 'openai' && provider !== 'anthropic') {
      console.log(`${colors.red}✗ Invalid provider. Please specify 'openai' or 'anthropic'.${colors.reset}`);
      rl.close();
      return;
    }
    
    apiKey = await new Promise(resolve => {
      rl.question(`Please enter your ${provider.toUpperCase()} API key: `, answer => {
        resolve(answer.trim());
      });
    });
    
    if (!apiKey) {
      console.log(`${colors.red}✗ No API key provided.${colors.reset}`);
      rl.close();
      return;
    }
  }

  console.log(`\n${colors.cyan}Testing connection to ${provider.toUpperCase()}...${colors.reset}`);
  
  // Set up the API call based on the provider
  try {
    let response;
    
    if (provider === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {role: 'system', content: 'You are a helpful assistant.'},
            {role: 'user', content: 'Say "Hello from OpenAI!" if you can receive this message.'}
          ],
          temperature: 0.7,
          max_tokens: 50
        })
      });
    } else if (provider === 'anthropic') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-instant-1',
          messages: [
            {role: 'user', content: 'Say "Hello from Anthropic!" if you can receive this message.'}
          ],
          temperature: 0.7,
          max_tokens: 50
        })
      });
    }
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`${colors.green}✓ Successfully connected to ${provider.toUpperCase()} API!${colors.reset}`);
      console.log(`${colors.green}✓ API response status: ${response.status}${colors.reset}`);
      
      // Show the response content
      let content = '';
      if (provider === 'openai' && data.choices && data.choices[0]) {
        content = data.choices[0].message.content;
      } else if (provider === 'anthropic' && data.content && data.content[0]) {
        content = data.content[0].text;
      }
      
      if (content) {
        console.log(`\n${colors.cyan}AI Response:${colors.reset} ${content}\n`);
      }
      
      // Now test the server endpoint
      console.log(`\n${colors.cyan}Testing local server endpoint (if running)...${colors.reset}`);
      try {
        const serverResponse = await fetch('http://localhost:5000/api/test-ai-connection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            provider: provider,
            model: provider === 'openai' ? 'gpt-3.5-turbo' : 'claude-instant-1'
          })
        });
        
        if (serverResponse.ok) {
          const serverData = await serverResponse.json();
          console.log(`${colors.green}✓ Local server connection test successful!${colors.reset}`);
          console.log(`${colors.green}✓ Sample response: ${serverData.sample_response}${colors.reset}`);
        } else {
          console.log(`${colors.red}✗ Local server test failed with status: ${serverResponse.status}${colors.reset}`);
          console.log(`${colors.yellow}⚠ Make sure your server is running on http://localhost:5000${colors.reset}`);
        }
      } catch (serverError) {
        console.log(`${colors.red}✗ Couldn't connect to local server: ${serverError.message}${colors.reset}`);
        console.log(`${colors.yellow}⚠ Make sure your server is running on http://localhost:5000${colors.reset}`);
      }
      
      console.log(`\n${colors.green}✅ Everything looks good with your ${provider.toUpperCase()} API key!${colors.reset}`);
      console.log(`${colors.cyan}If you're still experiencing issues with the Meta Prompt Arena, check:${colors.reset}`);
      console.log(`${colors.white}- Whether the API key is properly set in your .env file${colors.reset}`);
      console.log(`${colors.white}- Whether the server is running and can access the internet${colors.reset}`);
      console.log(`${colors.white}- Check server logs for any error messages${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ API call failed with status: ${response.status}${colors.reset}`);
      console.log(`${colors.red}✗ Error message: ${data.error?.message || JSON.stringify(data)}${colors.reset}`);
      
      if (data.error?.type === 'authentication_error') {
        console.log(`${colors.yellow}⚠ Authentication error: Your API key appears to be invalid.${colors.reset}`);
      } else if (response.status === 429) {
        console.log(`${colors.yellow}⚠ Rate limit exceeded: You may need to wait or check your usage limits.${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`${colors.red}✗ Connection test failed: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}⚠ This could indicate network issues or an invalid API key.${colors.reset}`);
  }
  
  rl.close();
}

main(); 