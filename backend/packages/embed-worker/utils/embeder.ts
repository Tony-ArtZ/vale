import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

export const generateEmbeddings = async (text: string) => {
  if (!text || text.trim() === "") {
    throw new Error("Cannot generate embeddings for empty text");
  }

  const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;

  try {
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-ada-002"),
      value: truncatedText,
    });
    return embedding;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw new Error(
      `Failed to generate embeddings: ${(error as Error).message}`
    );
  }
};
