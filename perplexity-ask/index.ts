#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

/**
 * Definition of the Perplexity Ask Tool.
 * This tool accepts an array of messages and returns a chat completion response
 * from the Perplexity API, with citations appended to the message if provided.
 */
const PERPLEXITY_ASK_TOOL: Tool = {
  name: "perplexity_ask",
  description:
    "Engages in a conversation using the Sonar API with enhanced control over search and reasoning. " +
    "Accepts messages and optional parameters to control response quality, search depth, and output format. " +
    "Ideal for quick development questions and general coding assistance.",
  inputSchema: {
    type: "object",
    properties: {
      messages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: {
              type: "string",
              description: "Role of the message (e.g., system, user, assistant)",
            },
            content: {
              type: "string",
              description: "The content of the message",
            },
          },
          required: ["role", "content"],
        },
        description: "Array of conversation messages",
      },
      search_context_size: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Controls search comprehensiveness. 'low' for basic queries (cost-effective), 'medium' for balanced results, 'high' for deep research and comprehensive coverage. Default: 'medium'",
      },
      max_tokens: {
        type: "number",
        minimum: 1,
        maximum: 4000,
        description: "Maximum number of tokens in the response. Controls response length. Typical values: 500-1500 for development questions.",
      },
      temperature: {
        type: "number",
        minimum: 0.0,
        maximum: 2.0,
        description: "Controls response creativity. Lower values (0.1-0.3) for precise technical answers, higher values (0.7-1.0) for creative solutions. Default: 0.2",
      },
      search_domain_filter: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Limit search to specific domains. Useful for development: ['github.com', 'stackoverflow.com', 'developer.mozilla.org']. Leave empty for all domains.",
      },
      return_related_questions: {
        type: "boolean",
        description: "Include follow-up question suggestions for deeper exploration. Helpful for discovering related development topics. Default: false",
      },
    },
    required: ["messages"],
  },
};

/**
 * Definition of the Perplexity Research Tool.
 * This tool performs deep research queries using the Perplexity API.
 */
const PERPLEXITY_RESEARCH_TOOL: Tool = {
  name: "perplexity_research",
  description:
    "Performs comprehensive deep research using the sonar-deep-research model. " +
    "Conducts iterative searches, reads multiple sources, and provides detailed analysis with citations. " +
    "Perfect for architectural decisions, technology comparisons, and thorough investigation of development topics.",
  inputSchema: {
    type: "object",
    properties: {
      messages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: {
              type: "string",
              description: "Role of the message (e.g., system, user, assistant)",
            },
            content: {
              type: "string",
              description: "The content of the message",
            },
          },
          required: ["role", "content"],
        },
        description: "Array of conversation messages",
      },
      reasoning_effort: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Controls research depth and reasoning complexity. 'low' for basic research, 'high' for complex architectural decisions and comprehensive analysis. Default: 'high'",
      },
      search_context_size: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Controls search comprehensiveness. 'high' recommended for deep research. Default: 'high'",
      },
      search_mode: {
        type: "string",
        enum: ["web", "academic"],
        description: "Search mode: 'web' for general sources, 'academic' for peer-reviewed papers and authoritative documentation. Default: 'web'",
      },
      max_tokens: {
        type: "number",
        minimum: 1000,
        maximum: 8000,
        description: "Maximum response length. Research reports typically need 2000-4000 tokens for comprehensive coverage.",
      },
      search_domain_filter: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Focus research on specific domains. For development: ['github.com', 'docs.python.org', 'nodejs.org', 'developer.mozilla.org']",
      },
      return_related_questions: {
        type: "boolean",
        description: "Include suggestions for follow-up research topics. Useful for comprehensive project planning. Default: true",
      },
      return_images: {
        type: "boolean",
        description: "Include relevant diagrams, architecture images, and visual aids in research results. Default: false",
      },
    },
    required: ["messages"],
  },
};

/**
 * Definition of the Perplexity Reason Tool.
 * This tool performs reasoning queries using the Perplexity API.
 */
const PERPLEXITY_REASON_TOOL: Tool = {
  name: "perplexity_reason",
  description:
    "Performs advanced reasoning and problem-solving using the sonar-reasoning-pro model. " +
    "Excels at logical analysis, step-by-step problem decomposition, and complex technical decision-making. " +
    "Ideal for debugging complex issues, algorithm design, and architectural reasoning.",
  inputSchema: {
    type: "object",
    properties: {
      messages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: {
              type: "string",
              description: "Role of the message (e.g., system, user, assistant)",
            },
            content: {
              type: "string",
              description: "The content of the message",
            },
          },
          required: ["role", "content"],
        },
        description: "Array of conversation messages",
      },
      reasoning_effort: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Reasoning complexity level. 'high' for complex debugging and architectural decisions, 'medium' for standard problem-solving. Default: 'high'",
      },
      max_tokens: {
        type: "number",
        minimum: 500,
        maximum: 4000,
        description: "Maximum response length. Reasoning tasks typically need 1000-2500 tokens for detailed step-by-step analysis.",
      },
      temperature: {
        type: "number",
        minimum: 0.0,
        maximum: 1.0,
        description: "Controls reasoning creativity. Lower values (0.1-0.3) for logical, systematic reasoning. Higher values (0.5-0.7) for creative problem-solving approaches. Default: 0.2",
      },
      search_context_size: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Search context for reasoning support. 'medium' for standard reasoning, 'high' when external context is crucial. Default: 'medium'",
      },
    },
    required: ["messages"],
  },
};

// Retrieve the Perplexity API key from environment variables
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
if (!PERPLEXITY_API_KEY) {
  console.error("Error: PERPLEXITY_API_KEY environment variable is required");
  process.exit(1);
}

const BASE_URL = process.env.BASE_URL;
if (!BASE_URL) {
  console.error("Error: BASE_URL environment variable is required");
  process.exit(1);
}

/**
 * Performs a chat completion by sending a request to the Perplexity API.
 * Appends citations to the returned message content if they exist.
 *
 * @param {Array<{ role: string; content: string }>} messages - An array of message objects.
 * @param {string} model - The model to use for the completion.
 * @param {object} options - Additional API parameters for enhanced control.
 * @returns {Promise<string>} The chat completion result with appended citations.
 * @throws Will throw an error if the API request fails.
 */
async function performChatCompletion(
  messages: Array<{ role: string; content: string }>,
  model: string = "sonar-pro",
  options: {
    search_context_size?: "low" | "medium" | "high";
    reasoning_effort?: "low" | "medium" | "high";
    search_mode?: "web" | "academic";
    max_tokens?: number;
    temperature?: number;
    search_domain_filter?: string[];
    return_related_questions?: boolean;
    return_images?: boolean;
  } = {}
): Promise<string> {
  // Construct the API endpoint URL and request body
  const url = new URL(BASE_URL!);
  const body: any = {
    model: model,
    messages: messages,
  };

  // Add optional parameters if provided
  if (options.search_context_size) {
    body.search_context_size = options.search_context_size;
  }
  if (options.reasoning_effort) {
    body.reasoning_effort = options.reasoning_effort;
  }
  if (options.search_mode) {
    body.search_mode = options.search_mode;
  }
  if (options.max_tokens) {
    body.max_tokens = options.max_tokens;
  }
  if (options.temperature !== undefined) {
    body.temperature = options.temperature;
  }
  if (options.search_domain_filter && options.search_domain_filter.length > 0) {
    body.search_domain_filter = options.search_domain_filter;
  }
  if (options.return_related_questions !== undefined) {
    body.return_related_questions = options.return_related_questions;
  }
  if (options.return_images !== undefined) {
    body.return_images = options.return_images;
  }

  let response;
  try {
    response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new Error(`Network error while calling Perplexity API: ${error}`);
  }

  // Check for non-successful HTTP status
  if (!response.ok) {
    let errorText;
    try {
      errorText = await response.text();
    } catch (parseError) {
      errorText = "Unable to parse error response";
    }
    throw new Error(
      `Perplexity API error: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  // Attempt to parse the JSON response from the API
  let data;
  try {
    data = await response.json();
  } catch (jsonError) {
    throw new Error(`Failed to parse JSON response from Perplexity API: ${jsonError}`);
  }

  // Safely retrieve the main message content from the response
  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new Error("Invalid API response: missing or empty choices array");
  }
  
  const choice = data.choices[0];
  if (!choice.message || typeof choice.message.content !== 'string') {
    throw new Error("Invalid API response: missing or invalid message content");
  }
  
  let messageContent = choice.message.content;

  // If citations are provided, append them to the message content
  if (data.citations && Array.isArray(data.citations) && data.citations.length > 0) {
    messageContent += "\n\nCitations:\n";
    data.citations.forEach((citation: string, index: number) => {
      messageContent += `[${index + 1}] ${citation}\n`;
    });
  }

  // If related questions are provided, append them
  if (data.related_questions && Array.isArray(data.related_questions) && data.related_questions.length > 0) {
    messageContent += "\n\nRelated Questions:\n";
    data.related_questions.forEach((question: string, index: number) => {
      messageContent += `${index + 1}. ${question}\n`;
    });
  }

  // If images are provided, append them
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    messageContent += "\n\nRelevant Images:\n";
    data.images.forEach((image: any, index: number) => {
      const title = image?.title || 'Image';
      const url = image?.url || 'URL not available';
      messageContent += `[${index + 1}] ${title}: ${url}\n`;
      if (image?.description) {
        messageContent += `    Description: ${image.description}\n`;
      }
    });
  }

  return messageContent;
}

// Initialize the server with tool metadata and capabilities
const server = new Server(
  {
    name: "mcp-server-perplexity",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Registers a handler for listing available tools.
 * When the client requests a list of tools, this handler returns all available Perplexity tools.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [PERPLEXITY_ASK_TOOL, PERPLEXITY_RESEARCH_TOOL, PERPLEXITY_REASON_TOOL],
}));

/**
 * Registers a handler for calling a specific tool.
 * Processes requests by validating input and invoking the appropriate tool.
 *
 * @param {object} request - The incoming tool call request.
 * @returns {Promise<object>} The response containing the tool's result or an error.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    if (!args) {
      throw new Error("No arguments provided");
    }
    switch (name) {
      case "perplexity_ask": {
        if (!Array.isArray(args.messages)) {
          throw new Error("Invalid arguments for perplexity_ask: 'messages' must be an array");
        }
        const messages = args.messages;
        const options: any = {};
        if (args.search_context_size) options.search_context_size = args.search_context_size;
        else options.search_context_size = "medium";
        if (args.max_tokens) options.max_tokens = args.max_tokens;
        if (args.temperature !== undefined) options.temperature = args.temperature;
        else options.temperature = 0.2;
        if (args.search_domain_filter) options.search_domain_filter = args.search_domain_filter;
        if (args.return_related_questions !== undefined) options.return_related_questions = args.return_related_questions;
        else options.return_related_questions = false;
        const result = await performChatCompletion(messages, "sonar-pro", options);
        return {
          content: [{ type: "text", text: result }],
          isError: false,
        };
      }
      case "perplexity_research": {
        if (!Array.isArray(args.messages)) {
          throw new Error("Invalid arguments for perplexity_research: 'messages' must be an array");
        }
        const messages = args.messages;
        const options: any = {};
        if (args.reasoning_effort) options.reasoning_effort = args.reasoning_effort;
        else options.reasoning_effort = "high";
        if (args.search_context_size) options.search_context_size = args.search_context_size;
        else options.search_context_size = "high";
        if (args.search_mode) options.search_mode = args.search_mode;
        else options.search_mode = "web";
        if (args.max_tokens) options.max_tokens = args.max_tokens;
        else options.max_tokens = 3000;
        if (args.search_domain_filter) options.search_domain_filter = args.search_domain_filter;
        if (args.return_related_questions !== undefined) options.return_related_questions = args.return_related_questions;
        else options.return_related_questions = true;
        if (args.return_images !== undefined) options.return_images = args.return_images;
        else options.return_images = false;
        const result = await performChatCompletion(messages, "sonar-deep-research", options);
        return {
          content: [{ type: "text", text: result }],
          isError: false,
        };
      }
      case "perplexity_reason": {
        if (!Array.isArray(args.messages)) {
          throw new Error("Invalid arguments for perplexity_reason: 'messages' must be an array");
        }
        const messages = args.messages;
        const options: any = {};
        if (args.reasoning_effort) options.reasoning_effort = args.reasoning_effort;
        else options.reasoning_effort = "high";
        if (args.max_tokens) options.max_tokens = args.max_tokens;
        else options.max_tokens = 2000;
        if (args.temperature !== undefined) options.temperature = args.temperature;
        else options.temperature = 0.2;
        if (args.search_context_size) options.search_context_size = args.search_context_size;
        else options.search_context_size = "medium";
        const result = await performChatCompletion(messages, "sonar-reasoning-pro", options);
        return {
          content: [{ type: "text", text: result }],
          isError: false,
        };
      }
      default:
        // Respond with an error if an unknown tool is requested
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    // Return error details in the response
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Initializes and runs the server using standard I/O for communication.
 * Logs an error and exits if the server fails to start.
 */
async function runServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Perplexity MCP Server running on stdio with Ask, Research, and Reason tools");
  } catch (error) {
    console.error("Fatal error running server:", error);
    process.exit(1);
  }
}

// Start the server and catch any startup errors
runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
