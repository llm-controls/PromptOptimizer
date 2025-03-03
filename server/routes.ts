import express from "express";
import { Express, Request, Response } from "express";
import { Server } from 'http';
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { 
  generateMetaPrompt, 
  generateVariations, 
  generateTestCases, 
  evaluateResponse 
} from "./ai-providers";
import { openai, anthropic } from "./config";
import { type ModelConfig } from "@shared/schema";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // Test endpoint to verify API is working
  router.get("/debug", (req, res) => {
    console.log("[Debug] API request received:", {
      path: req.path,
      method: req.method,
      headers: req.headers,
      body: req.body
    });
    res.json({ 
      status: "API is working",
      timestamp: new Date().toISOString(),
      path: req.path
    });
  });

  // API Keys endpoint
  router.get("/keys", (req, res) => {
    try {
      const apiKeys = {
        VITE_OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        VITE_ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
        VITE_GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      };

      res.header('Access-Control-Expose-Headers', 'X-API-Keys');
      res.header('X-API-Keys', JSON.stringify(apiKeys));
      res.json({ status: "ok" });
    } catch (error) {
      console.error("[API Keys] Error:", error);
      res.status(500).json({ 
        error: "Failed to process API keys",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Diagnostic endpoint to test AI connection
  router.post("/test-ai-connection", async (req, res) => {
    try {
      console.log("[test-ai-connection] Testing AI service connection");
      
      // Get provider and model from request or use defaults
      const provider = req.body.provider || "openai";
      const model = req.body.model || "gpt-4o";
      
      console.log(`[test-ai-connection] Testing with provider: ${provider}, model: ${model}`);
      
      // Simple test prompt
      const testPrompt = "Create a system prompt for a boxing coach AI assistant.";
      
      let response = "";
      
      if (provider === "openai") {
        const result = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: testPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        });
        
        response = result.choices[0].message.content || "";
      } 
      else if (provider === "anthropic") {
        const result = await anthropic.messages.create({
          model: model,
          max_tokens: 500,
          messages: [
            { role: "user", content: testPrompt }
          ],
          temperature: 0.7,
        });
        
        const messageContent = result.content[0];
        if (messageContent.type === 'text') {
          response = messageContent.text;
        } else {
          throw new Error("Unexpected response format from Anthropic");
        }
      }
      else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
      
      console.log("[test-ai-connection] API connection successful");
      res.status(200).json({
        success: true,
        message: "API connection working",
        sample_response: response.substring(0, 100) + "..."
      });
    } catch (error) {
      console.error("[test-ai-connection] API connection failed:", error);
      res.status(500).json({
        success: false,
        message: `API connection failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error
      });
    }
  });

  // Also support GET requests for easier browser testing
  router.get("/test-ai-connection", async (_req, res) => {
    try {
      console.log("[test-ai-connection] Testing API connection via GET");
      
      // Simple test to confirm API is operational
      const result = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say hello in one sentence." }
        ],
        temperature: 0.7,
        max_tokens: 50
      });
      
      const response = result.choices[0].message.content || "No response";
      
      // Return HTML for browser viewing
      res.send(`
        <html>
          <head>
            <title>API Connection Test</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              .success { color: green; }
              .box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; }
              pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
              h1 { color: #333; }
            </style>
          </head>
          <body>
            <h1>API Connection Test</h1>
            <div class="box">
              <h2 class="success">✅ API Connection Successful</h2>
              <p>Your OpenAI API key is working correctly!</p>
              <h3>Sample Response:</h3>
              <pre>${response}</pre>
              <p>If you're still having issues with your application, check:</p>
              <ul>
                <li>Your .env file has no spaces around the equal sign in API key definitions</li>
                <li>MOCK_API=false in your .env file</li>
                <li>You're using the right API endpoint paths in your front-end</li>
              </ul>
              <p><a href="/">Return to application</a></p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("[test-ai-connection] API connection failed:", error);
      res.status(500).send(`
        <html>
          <head>
            <title>API Connection Test</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              .error { color: red; }
              .box { border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 20px 0; }
              pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
              h1 { color: #333; }
            </style>
          </head>
          <body>
            <h1>API Connection Test</h1>
            <div class="box">
              <h2 class="error">❌ API Connection Failed</h2>
              <p>There was an error connecting to the OpenAI API:</p>
              <pre>${error instanceof Error ? error.message : String(error)}</pre>
              <p>Please check:</p>
              <ul>
                <li>Your API key is correct in the .env file</li>
                <li>Your server has internet access</li>
                <li>The OpenAI service is currently available</li>
              </ul>
            </div>
          </body>
        </html>
      `);
    }
  });

  router.post("/meta-prompt", async (req, res) => {
    try {
      const { basePrompt, modelConfig } = req.body;
      console.log("[routes] Generating meta prompt with config:", modelConfig);
      
      const metaPrompt = await generateMetaPrompt(basePrompt, modelConfig);

      res.status(200).json({ metaPrompt });
    } catch (error) {
      console.error("Error generating meta prompt:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  router.post("/variations", async (req, res) => {
    try {
      const { metaPrompt, modelConfig } = req.body;

      const variations = await generateVariations(metaPrompt, modelConfig);

      res.status(200).json({ variations });
    } catch (error) {
      console.error("Error generating variations:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  router.post("/test-cases", async (req, res) => {
    try {
      const { metaPrompt, modelConfig } = req.body;

      const testCases = await generateTestCases(metaPrompt, modelConfig);

      res.status(200).json({ testCases });
    } catch (error) {
      console.error("Error generating test cases:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  router.post("/evaluate", async (req, res) => {
    try {
      const { response, criterion, modelConfig } = req.body;

      const score = await evaluateResponse(response, criterion, modelConfig);

      res.status(200).json({ score });
    } catch (error) {
      console.error("Error evaluating response:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // New endpoint to generate AI responses
  router.post("/generate", async (req, res) => {
    try {
      const { systemPrompt, userInput, modelConfig } = req.body;
      console.log("[routes] Generating AI response with config:", modelConfig);
      
      let response = "";
      
      if (modelConfig.provider === "openai") {
        const result = await openai.chat.completions.create({
          model: modelConfig.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userInput }
          ],
          temperature: modelConfig.temperature,
          max_tokens: modelConfig.maxTokens || 1000,
          top_p: modelConfig.topP
        });
        
        response = result.choices[0].message.content || "";
      } else if (modelConfig.provider === "anthropic") {
        const result = await anthropic.messages.create({
          model: modelConfig.model,
          system: systemPrompt,
          messages: [
            { role: "user", content: userInput }
          ],
          temperature: modelConfig.temperature,
          max_tokens: modelConfig.maxTokens || 1000
        });
        
        if (result.content && result.content.length > 0) {
          const messageContent = result.content[0];
          if (messageContent.type === 'text') {
            response = messageContent.text;
          }
        }
      } else {
        throw new Error(`Unsupported provider: ${modelConfig.provider}`);
      }
      
      res.status(200).json({ response });
    } catch (error) {
      console.error("Error generating AI response:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // New endpoint to directly test AI provider connections
  router.post("/test-ai-connection", async (req, res) => {
    try {
      const { provider, model } = req.body;
      console.log("[routes] Testing AI connection for provider:", provider, "model:", model);
      
      let response = "";
      
      if (provider === "openai") {
        const result = await openai.chat.completions.create({
          model: model || "gpt-4o",
          messages: [
            { role: "system", content: "You are a helpful AI assistant." },
            { role: "user", content: "Please respond with the text 'OpenAI connection successful!' and today's date." }
          ],
          max_tokens: 100
        });
        
        response = result.choices[0].message.content || "";
      } else if (provider === "anthropic") {
        const result = await anthropic.messages.create({
          model: model || "claude-3-5-sonnet-20241022",
          system: "You are a helpful AI assistant.",
          messages: [
            { role: "user", content: "Please respond with the text 'Anthropic connection successful!' and today's date." }
          ],
          max_tokens: 100
        });
        
        if (result.content && result.content.length > 0) {
          const messageContent = result.content[0];
          if (messageContent.type === 'text') {
            response = messageContent.text;
          }
        }
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
      
      if (response) {
        res.status(200).json({ success: true, message: response });
      } else {
        throw new Error("Empty response from provider");
      }
    } catch (error) {
      console.error("Error testing AI connection:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        details: JSON.stringify(error)
      });
    }
  });

  // Add a route to serve the AI connection test page
  router.get("/test-connection", (req, res) => {
    // Read the test-connection.html file
    const path = require('path');
    const fs = require('fs');
    
    try {
      const htmlPath = path.join(__dirname, 'test-connection.html');
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.status(200).send(html);
    } catch (error) {
      console.error("Error serving test connection page:", error);
      res.status(500).send("Error loading test page");
    }
  });

  // Mount all routes under /api
  app.use("/api", router);

  // Only serve static files in production mode
  // In development, Vite will handle the client serving
  if (process.env.NODE_ENV === 'production') {
    // Serve static files from the React app
    const distPath = path.join(__dirname, "../client/dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      
      // The "catchall" handler: for any request that doesn't
      // match one above, send back React's index.html file.
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.warn(`Warning: Production build directory ${distPath} does not exist. Client files will not be served.`);
    }
  }

  // Create an HTTP server but don't start it - let index.ts handle that
  const server = createServer(app);
  return server;
}