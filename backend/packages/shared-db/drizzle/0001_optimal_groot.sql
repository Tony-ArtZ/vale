CREATE TABLE "messages_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"pending_work" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"embedding" vector(1536)
);
--> statement-breakpoint
DROP TABLE "product_embeddings" CASCADE;--> statement-breakpoint
CREATE INDEX "embeddingIndex" ON "messages_summary" USING hnsw ("embedding" vector_cosine_ops);