import { openai, anthropic } from "./config";
import { type ModelConfig } from "@shared/schema";

// System prompts for different tasks
const SYSTEM_PROMPTS = {
  metaPrompt: `You are an expert prompt engineer with deep expertise in creating effective system prompts for AI assistants. Your task is to transform the user's base prompt into a comprehensive, detailed system prompt that will produce optimal AI responses.

The system prompt you create will:
1. Define a clear role and persona for the AI
2. Specify the exact output format and style expectations
3. Set precise constraints, guidelines, and limitations
4. Address potential edge cases and include safety measures
5. Include specific examples of ideal responses when appropriate

Make the prompt detailed, actionable, and focused on producing high-quality AI output. Avoid vague directives and ensure the prompt would guide an AI to respond exactly as desired.

IMPORTANT FORMATTING INSTRUCTIONS:
- Begin with "..." and continue with a detailed role description
- Include specific sections for GUIDELINES, TONE, FORMAT, CONSTRAINTS, and EXAMPLES if appropriate
- Make the prompt at least 250-400 words to ensure sufficient detail
- Use second-person perspective (You should...)
- Do NOT include any meta-commentary or explanations outside the prompt itself

EXAMPLE SYSTEM PROMPT:
"""
You are an AI assistant that specializes in technical code reviews. Your primary role is to analyze code submissions, identify bugs, security vulnerabilities, performance issues, and suggest improvements.

GUIDELINES:
- Always begin by identifying the programming language and summarizing what the code appears to do
- Identify critical issues first, then minor issues, then optimizations
- For each issue, explain why it's a problem and provide a specific code example showing how to fix it
- Look for security vulnerabilities like SQL injection, XSS, buffer overflows and explain mitigation
- Analyze computational complexity (Big O) when relevant

TONE:
- Maintain a professional, constructive tone
- Be precise and specific, avoiding vague feedback
- Use technical terminology appropriately but explain advanced concepts

FORMAT:
1. Code Summary (2-3 sentences)
2. Critical Issues (security/correctness)
3. Performance Concerns
4. Style and Readability
5. Positive Aspects
6. Improved Version (complete rewrite of the most problematic sections)

CONSTRAINTS:
- Never execute or test the code yourself
- If the code purpose is unclear, state assumptions before proceeding
- For incomplete code fragments, focus on available sections only
- If the code appears malicious, decline to provide optimization help
"""

Now, convert the following base prompt into a detailed system prompt:`,

  variations: `You are an expert prompt engineer who specializes in creating strategic variations of system prompts. Your task is to generate 3 high-quality variations of the given system prompt, each with a distinct approach while preserving the core functionality.

For each variation:
1. Change the AI's persona/character significantly (e.g., from formal expert to friendly coach)
2. Modify the framework or methodology (e.g., from step-by-step to conceptual)
3. Adjust the depth of detail and explanation style
4. Shift emphasis to different aspects of the task

Each variation must:
- Begin with "You are an AI assistant that..."
- Maintain the same core capabilities and purpose
- Be comprehensive and detailed (200+ words)
- Have a distinct character/approach from the others
- Be immediately usable as a system prompt

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:
Separate each complete variation with a line containing only "---" (three hyphens)
Do not include any explanations or commentary outside the actual prompt variations

VARIATION STRATEGIES TO CONSIDER:
- Expert vs. Teacher vs. Collaborative Partner approaches
- Formal/Technical vs. Conversational/Approachable style
- Process-oriented vs. Outcome-oriented focus
- Analytical vs. Creative emphasis
- Concise vs. Detailed explanation style

Here is the original system prompt to create variations for:`,

  testCases: `You are an expert test designer who specializes in creating diverse, challenging test cases to evaluate AI assistants. Your task is to generate 5 high-quality test cases that will thoroughly evaluate an AI using the provided system prompt.

Create test cases that:
1. Cover a wide range of usage scenarios from basic to complex
2. Include at least one edge case that tests boundary conditions
3. Include at least one challenging or potentially ambiguous request
4. Test the AI's adherence to constraints in the system prompt
5. Evaluate both common and unusual use patterns

Each test case should:
- Be a realistic user input that someone might actually ask
- Be specific and actionable (avoid vague queries)
- Test a distinct aspect or capability
- Require thoughtful application of the system prompt guidelines

FORMAT REQUIREMENTS:
- Start each test case with "Test case: " followed by the exact user input
- Each test case must be a single line/paragraph
- Provide exactly 5 test cases, numbered 1-5
- Do not include explanations or commentary

EXAMPLE TEST CASES (for a coding assistant):
Test case: Write a Python function to find the longest palindromic substring in a given string with O(n²) time complexity.
Test case: Debug this code snippet and explain what's wrong: for(i=0; i<arr.length; i++) { total += arr[i+1]; }
Test case: How would you implement a concurrent hashmap in Java that optimizes for read-heavy workloads?
Test case: Compare and contrast REST and GraphQL APIs with specific examples of when to use each.
Test case: I need to scrape a website for data. What's the most ethical approach and what libraries should I use?

Based on this system prompt, generate 5 diverse and effective test cases:`,

  evaluation: `You are an expert evaluator of AI responses. Your task is to analyze the provided AI response and assign a precise numerical score based on how well it satisfies the given criterion.

SCORING INSTRUCTIONS:
- Score on a scale from 0 to 10 with 0.5 point precision
- Use the following benchmarks:
  * 0-2: Poor/Inadequate (fails to address the criterion)
  * 3-4: Below Average (partially addresses with significant issues)
  * 5-6: Average (adequately addresses with some issues)
  * 7-8: Good (effectively addresses with minor issues)
  * 9-10: Excellent (masterfully addresses with no significant issues)

EVALUATION PRINCIPLES:
1. Relevance: How directly does the response address the criterion?
2. Completeness: Does it fully cover all aspects of the criterion?
3. Accuracy: Is the information provided correct and precise?
4. Effectiveness: How well does it achieve the intended goal?
5. Quality: Is the response well-structured, clear, and appropriate?

YOUR RESPONSE FORMAT:
- Output ONLY a single number representing your score
- Do not include any explanation, justification, or additional text
- Examples of valid responses: "7", "8.5", "4", "9.5"

Now evaluate the following AI response based on this criterion:`,
};

export async function generateMetaPrompt(
  basePrompt: string,
  config: ModelConfig
): Promise<string> {
  try {
    // Log the input to help with debugging
    console.log("[generateMetaPrompt] Input:", { basePrompt: basePrompt.substring(0, 100) + "...", config });
    
    // Force MOCK_API to false to ensure we're using the real API
    const shouldMock = false; // Forcibly disable mocking
    
    let generatedPrompt = '';
    
    // Only proceed with API call if we're not in mock mode
    if (!shouldMock) {
      if (config.provider === "openai") {
        try {
          console.log("[generateMetaPrompt] 🔄 Calling OpenAI API...");
          const response = await openai.chat.completions.create({
            model: config.model,
            messages: [
              { role: "system", content: SYSTEM_PROMPTS.metaPrompt },
              { role: "user", content: basePrompt },
            ],
            temperature: config.temperature,
            max_tokens: config.maxTokens,
            top_p: config.topP,
          });
          
          if (response.choices && response.choices.length > 0) {
            generatedPrompt = response.choices[0].message.content || '';
            console.log("[generateMetaPrompt] ✅ OpenAI response received");
          } else {
            throw new Error("OpenAI returned empty response");
          }
        } catch (error) {
          console.error("[generateMetaPrompt] ❌ OpenAI API error:", error);
          throw error;
        }
      } else if (config.provider === "anthropic") {
        try {
          console.log("[generateMetaPrompt] 🔄 Calling Anthropic API...");
          const response = await anthropic.messages.create({
            model: config.model,
            system: SYSTEM_PROMPTS.metaPrompt,
            messages: [
              { role: "user", content: basePrompt },
            ],
            temperature: config.temperature,
            max_tokens: config.maxTokens,
          });
          
          if (response.content && response.content.length > 0) {
            const messageContent = response.content[0];
            if (messageContent.type === 'text') {
              generatedPrompt = messageContent.text;
              console.log("[generateMetaPrompt] ✅ Anthropic response received");
            } else {
              throw new Error("Unexpected response format from Anthropic");
            }
          } else {
            throw new Error("Anthropic returned empty response");
          }
        } catch (error) {
          console.error("[generateMetaPrompt] ❌ Anthropic API error:", error);
          throw error;
        }
      } else {
        throw new Error(`Unsupported provider: ${config.provider}`);
      }
    } else {
      // This should never execute since we force shouldMock to false
      console.warn("[generateMetaPrompt] ⚠️ Using MOCK mode - returning mock data");
      generatedPrompt = "This is a mock meta prompt response. Please set MOCK_API=false in your .env file.";
    }

    console.log("[generateMetaPrompt] Generated prompt length:", generatedPrompt.length);
    return generatedPrompt;
  } catch (error) {
    console.error("[AI Provider] Failed to generate meta prompt:", error);
    throw error;
  }
}

export async function generateVariations(
  metaPrompt: string,
  config: ModelConfig
): Promise<string[]> {
  try {
    // Log the input to help with debugging
    console.log("[generateVariations] Input:", { 
      metaPrompt: metaPrompt.substring(0, 100) + "...", 
      config 
    });
    
    // Check for mocking configuration
    const shouldMock = false; // Forcibly disable mocking
    
    let rawVariations = '';
    // Only proceed with API call if we're not in mock mode
    if (!shouldMock) {
      // Use higher temperature for variations to ensure they're different
      const variationConfig = {
        ...config,
        temperature: Math.min((config.temperature || 0.7) * 1.5, 1.0), // Increase temperature but max 1.0
      };
      
      console.log("[generateVariations] Using temperature:", variationConfig.temperature);
      
      if (config.provider === "openai") {
        try {
          console.log("[generateVariations] 🔄 Calling OpenAI API...");
          const response = await openai.chat.completions.create({
            model: config.model,
            messages: [
              { role: "system", content: SYSTEM_PROMPTS.variations },
              { role: "user", content: metaPrompt },
            ],
            temperature: variationConfig.temperature,
            max_tokens: config.maxTokens || 4000, // Need more tokens for multiple variations
            top_p: config.topP,
          });
          
          if (response.choices && response.choices.length > 0) {
            rawVariations = response.choices[0].message.content || '';
            console.log("[generateVariations] ✅ OpenAI response received, length:", rawVariations.length);
          } else {
            throw new Error("OpenAI returned empty response for variations");
          }
        } catch (error) {
          console.error("[generateVariations] ❌ OpenAI API error:", error);
          throw error;
        }
      } else if (config.provider === "anthropic") {
        try {
          console.log("[generateVariations] 🔄 Calling Anthropic API...");
          const response = await anthropic.messages.create({
            model: config.model,
            system: SYSTEM_PROMPTS.variations,
            messages: [
              { role: "user", content: metaPrompt },
            ],
            temperature: variationConfig.temperature,
            max_tokens: config.maxTokens || 4000,
          });
          
          if (response.content && response.content.length > 0) {
            const messageContent = response.content[0];
            if (messageContent.type === 'text') {
              rawVariations = messageContent.text;
              console.log("[generateVariations] ✅ Anthropic response received, length:", rawVariations.length);
            } else {
              throw new Error("Unexpected response format from Anthropic");
            }
          } else {
            throw new Error("Anthropic returned empty response for variations");
          }
        } catch (error) {
          console.error("[generateVariations] ❌ Anthropic API error:", error);
          throw error;
        }
      } else {
        throw new Error(`Unsupported provider: ${config.provider}`);
      }
    } else {
      // This should never execute since we force shouldMock to false
      console.warn("[generateVariations] ⚠️ Using MOCK mode - returning mock data");
      rawVariations = "Variation 1\n---\nVariation 2\n---\nVariation 3";
    }
    
    // Parse the response into separate variations
    const variations = rawVariations
      .split('---')
      .map(v => v.trim())
      .filter(v => v.length > 0);
    
    console.log("[generateVariations] Parsed variations count:", variations.length);
    
    // Ensure we have at least one variation
    if (variations.length === 0) {
      throw new Error("Failed to parse variations from model response");
    }
    
    return variations;
  } catch (error) {
    console.error("[AI Provider] Failed to generate variations:", error);
    throw error;
  }
}

export async function generateTestCases(
  metaPrompt: string,
  config: ModelConfig
): Promise<string[]> {
  try {
    // Log the input to help with debugging
    console.log("[generateTestCases] Input:", { 
      metaPrompt: metaPrompt.substring(0, 100) + "...", 
      config 
    });
    
    // Check for mocking configuration
    const shouldMock = false; // Forcibly disable mocking
    
    let rawTestCases = '';
    // Only proceed with API call if we're not in mock mode
    if (!shouldMock) {
      if (config.provider === "openai") {
        try {
          console.log("[generateTestCases] 🔄 Calling OpenAI API...");
          const response = await openai.chat.completions.create({
            model: config.model,
            messages: [
              { role: "system", content: SYSTEM_PROMPTS.testCases },
              { role: "user", content: metaPrompt },
            ],
            temperature: config.temperature,
            max_tokens: config.maxTokens || 2000,
            top_p: config.topP,
          });
          
          if (response.choices && response.choices.length > 0) {
            rawTestCases = response.choices[0].message.content || '';
            console.log("[generateTestCases] ✅ OpenAI response received, length:", rawTestCases.length);
          } else {
            throw new Error("OpenAI returned empty response for test cases");
          }
        } catch (error) {
          console.error("[generateTestCases] ❌ OpenAI API error:", error);
          throw error;
        }
      } else if (config.provider === "anthropic") {
        try {
          console.log("[generateTestCases] 🔄 Calling Anthropic API...");
          const response = await anthropic.messages.create({
            model: config.model,
            system: SYSTEM_PROMPTS.testCases,
            messages: [
              { role: "user", content: metaPrompt },
            ],
            temperature: config.temperature,
            max_tokens: config.maxTokens || 2000,
          });
          
          if (response.content && response.content.length > 0) {
            const messageContent = response.content[0];
            if (messageContent.type === 'text') {
              rawTestCases = messageContent.text;
              console.log("[generateTestCases] ✅ Anthropic response received, length:", rawTestCases.length);
            } else {
              throw new Error("Unexpected response format from Anthropic");
            }
          } else {
            throw new Error("Anthropic returned empty response for test cases");
          }
        } catch (error) {
          console.error("[generateTestCases] ❌ Anthropic API error:", error);
          throw error;
        }
      } else {
        throw new Error(`Unsupported provider: ${config.provider}`);
      }
    } else {
      // This should never execute since we force shouldMock to false
      console.warn("[generateTestCases] ⚠️ Using MOCK mode - returning mock data");
      rawTestCases = "Test case: A straightforward test case\nTest case: A more complex scenario\nTest case: An edge case\nTest case: A boundary condition\nTest case: An unusual request";
    }
    
    // Parse the response into separate test cases
    const testCaseLines = rawTestCases.split('\n').filter(line => line.trim().startsWith('Test case:'));
    
    // Extract the test cases and cleanup
    const testCases = testCaseLines.map(line => line.replace(/^Test case:\s*/, '').trim());
    
    console.log("[generateTestCases] Parsed test cases count:", testCases.length);
    
    // Ensure we have at least one test case
    if (testCases.length === 0) {
      throw new Error("Failed to parse test cases from model response");
    }
    
    return testCases;
  } catch (error) {
    console.error("[AI Provider] Failed to generate test cases:", error);
    throw error;
  }
}

export async function evaluateResponse(
  response: string,
  criterion: string,
  config: ModelConfig
): Promise<number> {
  try {
    const prompt = `${SYSTEM_PROMPTS.evaluation}\n\nCriterion: "${criterion}"\n\nResponse to evaluate:\n${response}`;

    if (config.provider === "openai") {
      const completion = await openai.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: prompt },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        top_p: config.topP,
      });

      const score = parseFloat(completion.choices[0].message.content || "0");
      return Math.min(10, Math.max(0, score));
    } 
    else if (config.provider === "anthropic") {
      const message = await anthropic.messages.create({
        model: config.model,
        max_tokens: config.maxTokens,
        messages: [{ role: "user", content: prompt }],
        temperature: config.temperature,
      });

      const messageContent = message.content[0];
      if (messageContent.type === 'text') {
        const score = parseFloat(messageContent.text);
        return Math.min(10, Math.max(0, score));
      }
      throw new Error("Unexpected response format from Anthropic");
    }

    throw new Error(`Unsupported provider: ${config.provider}`);
  } catch (error) {
    console.error("[AI Provider] Failed to evaluate response:", error);
    throw error;
  }
}