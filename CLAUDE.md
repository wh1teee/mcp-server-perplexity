# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an enhanced MCP (Model Context Protocol) server that integrates with the Perplexity Sonar API to provide comprehensive real-time web research capabilities. The server exposes three advanced tools with extensive parameter control:

- `perplexity_ask`: General chat completion with search control (sonar-pro model)
- `perplexity_research`: Deep research with reasoning control (sonar-deep-research model)  
- `perplexity_reason`: Advanced reasoning and problem-solving (sonar-reasoning-pro model)

### Enhanced Features
- **Search Control**: Adjustable search context size (low/medium/high)
- **Reasoning Control**: Configurable reasoning effort levels
- **Domain Filtering**: Focus searches on specific domains
- **Academic Mode**: Access to peer-reviewed sources
- **Response Control**: Temperature, max tokens, related questions
- **Visual Content**: Optional image inclusion in research results

## Development Commands

**Build the project:**
```bash
cd perplexity-ask && pnpm run build
```

**Watch mode for development:**
```bash
cd perplexity-ask && pnpm run watch
```

**Install dependencies:**
```bash
cd perplexity-ask && pnpm install
```

**Docker build:**
```bash
cd perplexity-ask && docker build -t mcp/perplexity-ask:latest -f Dockerfile .
```

## Architecture

- **Main entry point**: `perplexity-ask/index.ts` - Enhanced MCP server implementation
- **Core function**: `performChatCompletion()` handles all API interactions with full parameter support
- **Transport**: Uses StdioServerTransport for MCP communication
- **Tool definitions**: Three enhanced tools with comprehensive JSON schema validation
- **Parameter handling**: Intelligent defaults and validation for all optional parameters
- **Response processing**: Enhanced citation, related questions, and image handling

## Environment Variables

Required environment variables for operation:
- `PERPLEXITY_API_KEY`: API key for Perplexity Sonar API
- `BASE_URL`: API endpoint (defaults to https://api.perplexity.ai/chat/completions)

## Key Implementation Details

- **Message Format**: All tools use array of objects with `role` and `content` fields
- **Parameter Handling**: Extensive optional parameters for fine-tuning API behavior
- **Response Enhancement**: Citations, related questions, and images automatically appended
- **Error Handling**: Comprehensive network, HTTP status, and JSON parsing error handling
- **Type Safety**: Full TypeScript implementation with proper parameter validation
- **Default Values**: Intelligent defaults optimized for development assistance

## Tool Parameters

### perplexity_ask
- `search_context_size`: "low"/"medium"/"high" (default: "medium")
- `max_tokens`: Response length limit
- `temperature`: 0.0-2.0, creativity control (default: 0.2)
- `search_domain_filter`: Array of domains to focus on
- `return_related_questions`: Boolean for follow-up suggestions

### perplexity_research  
- `reasoning_effort`: "low"/"medium"/"high" (default: "high")
- `search_context_size`: "low"/"medium"/"high" (default: "high")
- `search_mode`: "web"/"academic" (default: "web")
- `max_tokens`: Response length (default: 3000)
- `search_domain_filter`: Domain filtering
- `return_related_questions`: Follow-up questions (default: true)
- `return_images`: Include visual content

### perplexity_reason
- `reasoning_effort`: "low"/"medium"/"high" (default: "high")
- `max_tokens`: Response length (default: 2000)
- `temperature`: Reasoning creativity (default: 0.2)
- `search_context_size`: "low"/"medium"/"high" (default: "medium")

## Release Process

Use the automated release script:
```bash
./scripts/release.sh
```

This handles version bumping, git tagging, and pushing changes. GitHub Actions automatically publishes to npm.

## Usage Examples for Development

**Quick technical question:**
```json
{
  "messages": [{"role": "user", "content": "How to implement JWT authentication in Node.js?"}],
  "search_domain_filter": ["github.com", "nodejs.org", "jwt.io"]
}
```

**Deep research for architecture decisions:**
```json
{
  "messages": [{"role": "user", "content": "Compare microservices vs monolith for a medium-scale application"}],
  "reasoning_effort": "high",
  "search_context_size": "high",
  "return_related_questions": true,
  "max_tokens": 4000
}
```

**Complex debugging with step-by-step reasoning:**
```json
{
  "messages": [{"role": "user", "content": "Memory leak in React useEffect, how to debug?"}],
  "reasoning_effort": "high",
  "temperature": 0.1,
  "search_domain_filter": ["reactjs.org", "stackoverflow.com"]
}
```

## Docker Configuration

The Dockerfile uses multi-stage builds:
1. **deps**: Installs dependencies
2. **builder**: Compiles TypeScript 
3. **runner**: Production runtime with only built artifacts