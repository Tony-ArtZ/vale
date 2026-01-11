import { createMCPClient } from "@ai-sdk/mcp";
import type { MCPClient } from "../types/mcp";

export const generateMCPClient = async (servers: string[]) => {
  const mcpClients: MCPClient[] = [];
  for (const server of servers) {
    const mcpClient = await createMCPClient({
      transport: {
        type: "sse",
        url: server,
      },
    });

    mcpClients.push(mcpClient);
  }

  return mcpClients;
};
