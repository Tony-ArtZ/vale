import { embed } from "ai";
import { openAiEmbedConfig } from "../utils/openai-config";

/**
 * Generates embeddings for the given text using OpenAI's embedding model
 * For medicine data, we focus on product name and description
 *
 * @param text Text to generate embeddings for
 * @returns Array of embedding values
 */
export const generateEmbeddings = async (text: string) => {
  if (!text || text.trim() === "") {
    throw new Error("Cannot generate embeddings for empty text");
  }

  const truncatedText = text.length > 8000 ? text.substring(0, 8000) : text;

  try {
    const { embedding } = await embed({
      ...openAiEmbedConfig,
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
