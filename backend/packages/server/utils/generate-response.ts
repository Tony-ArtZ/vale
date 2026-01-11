import { generateText, type ModelMessage, type ToolSet, stepCountIs } from "ai";
import { openAiConfig } from "./openai-config";
import { createTools } from "../constants/function";
import { getMessage, getPreviousSummary, saveMessage } from "./message-helper";
import { getAllPreferences } from "./user-prefs-helper";
import { getPromptObject } from "./prompt";
import type { AnimationType } from "../types/animations";
import { getTimeStamp } from "../constants/day";
import { generateMCPClient } from "./mcp-client";
import type { MCPClient } from "../types/mcp";

type GenerateResponseOptions = {
  userId: string;
  userName: string;
  spotifyToken?: string;
  localTime?: string;
  mcpServers?: string[];
  vitals?: { heartRate: number; o2Level: number; stress: string };
  userEmotion?: { emotion: string; confidence: number };
};

export async function generateAIResponse(
  initialMessage: string,
  initialRole: "user" | "system",
  options: GenerateResponseOptions
) {
  const {
    userId,
    userName,
    spotifyToken,
    localTime,
    mcpServers,
    vitals,
    userEmotion,
  } = options;

  // Save the current message
  await saveMessage(initialMessage, initialRole, userId);

  // Get list of previous messages
  const messages = await getMessage(4, userId);
  const messagesModified = messages.map(({ role, content }) => ({
    role,
    content,
  }));

  // Get the preferences of the user
  const userPreferences = await getAllPreferences(userId);

  // Get previous conversation summary
  const prevConversations = await getPreviousSummary(2, userId);

  // Format previous conversations for better context integration
  let formattedPrevConversations = "";
  if (prevConversations && prevConversations.length > 0) {
    formattedPrevConversations = prevConversations
      .map(
        (convo, index) => `Conversation ${index + 1}: ${JSON.stringify(convo)}`
      )
      .join("\n\n");
  }

  // Messages history with prompt attached
  const prompt = getPromptObject(
    userName,
    userPreferences,
    localTime ? getTimeStamp(localTime) : "",
    formattedPrevConversations,
    vitals,
    userEmotion
  );

  const messageWithPrompt = [prompt, ...messagesModified];

  //Try to generate MCP Clients
  const mcpTools: ToolSet[] = [];
  let mcpClients: MCPClient[] | null = null;

  if (mcpServers && mcpServers.length > 0) {
    try {
      mcpClients = await generateMCPClient(mcpServers);
      for (const mcpClient of mcpClients) {
        const tool = await mcpClient.tools();
        mcpTools.push(tool);
      }
    } catch (error) {
      console.error("Error generating MCP clients:", error);
      return {
        role: "assistant",
        content: "Error generating MCP clients. Please try again.",
        animation: "Disappointed",
      };
    }
  }

  const result = await generateText({
    ...openAiConfig,
    messages: messageWithPrompt as ModelMessage[],
    toolChoice: "auto",
    tools: {
      ...createTools(spotifyToken, userId, userName),
      ...Object.assign({}, ...mcpTools),
    },
    stopWhen: stepCountIs(3),
  });

  // Initialize response variables
  let animation: AnimationType | undefined;
  let finalContent = "";

  // Extract animation from the last tool result
  for (const msg of result.response.messages) {
    if (msg.role === "tool" && Array.isArray(msg.content)) {
      for (const item of msg.content) {
        if (item.type === "tool-result" && item.toolName === "setAnimation") {
          // In AI SDK 6, the result is in item.output which could be content or unknown type
          const output = item.output as unknown;
          if (output && typeof output === "object" && "animation" in output) {
            animation = (output as { animation: AnimationType }).animation;
            break;
          }
        }
      }
    } else if (msg.role === "assistant" && Array.isArray(msg.content)) {
      for (const item of msg.content) {
        if (item.type === "text" && item.text !== finalContent) {
          finalContent += item.text;
        }
      }
    }
  }

  // De-initialize the MCP clients
  if (mcpClients) {
    for (const mcpClient of mcpClients) {
      await mcpClient.close();
    }
  }

  // Save the assistant's response
  await saveMessage(finalContent, "assistant", userId);

  // Prepare the response object
  const response: {
    role: string;
    content: string;
    animation?: AnimationType;
  } = {
    role: "assistant",
    content: finalContent,
  };

  if (animation) {
    response.animation = animation;
  }

  return response;
}
