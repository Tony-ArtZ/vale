import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { Message } from "./message-utils";

const PROMPT = `
# CONVERSATION SUMMARIZER INSTRUCTIONS

## PRIMARY TASK
You are analyzing a conversation between an AI assistant (Veronica) and a user. Create THREE distinct outputs:

1. TITLE: Create a clear, specific title (3-8 words) that accurately represents the main topic or purpose of the conversation. Format as "TITLE: [Your Title Here]"

2. SUMMARY: Generate a concise summary (maximum 2 sentences) highlighting ONLY the most important information from the conversation. Format as "SUMMARY: [Your Summary Here]"

3. PENDING WORK: Identify if the AI was in the middle of performing a task or waiting for user confirmation. Format as "PENDING WORK: [Task Description]". If no pending work was detected, leave this blank.

## REQUIREMENTS
- Focus exclusively on extracting key information, preferences, decisions, or topics discussed
- Include specific details where relevant (names, preferences, decisions made)
- Use keywords and phrases that would be useful for future retrieval
- Summarize user-specific information that might be valuable for personalization
- If the conversation contains minimal substantive content, limit the summary to a brief phrase
- For pending work, look for:
  - Statements where the AI offers to do something and awaits confirmation
  - Incomplete tasks where the AI was gathering information
  - Function calls that were initiated but not completed
  - Explicit questions where the AI was waiting for a user response to proceed

## FORMATTING
- Keep total output under 500 characters when possible
- Use clear, concise language
- Avoid unnecessary filler or vague language
`;
export async function summarizeMessages(
  messages: Message[]
): Promise<{ summary: string; title: string; pendingWork: string }> {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      summary: z.string().describe("Summary of the conversation"),
      title: z.string().describe("Title of the conversation"),
      pendingWork: z.string().describe("Detail of any task the AI was performing or waiting for confirmation on. ## Return NA if not applicable."),
    }),
    messages: [
      {
        role: "user",
        content: `${PROMPT} ${messages
          .filter((msg) => msg.role != "system")
          .map((msg) => msg.role + ": " + msg.content)
          .join("\n")}`,
      },
    ],
  });

  return { 
    summary: object.summary, 
    title: object.title, 
    pendingWork: object.pendingWork || "" 
  };
}
