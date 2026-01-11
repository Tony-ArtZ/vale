import { createMCPClient } from "@ai-sdk/mcp";

export type MCPClient = Awaited<ReturnType<typeof createMCPClient>>;
