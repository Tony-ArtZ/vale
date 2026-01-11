import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Define embedding dimensions as a constant
export const EMBEDDING_DIMENSIONS = 1536;

// Users table (corresponding to User model)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  userName: varchar("user_name", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
});

// Define relations for users
export const usersRelations = relations(users, ({ many }) => ({
  messages: many(messages),
  tokens: many(tokens),
  refreshTokens: many(refreshTokens),
  preferences: many(userPreferences),
}));

// Messages table (corresponding to Messages model)
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 100 }).notNull(),
  content: text("content").notNull(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  timeStamp: timestamp("time_stamp").notNull().defaultNow(),
});

// Define relations for messages
export const messagesRelations = relations(messages, ({ one }) => ({
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

// Tokens table (corresponding to TokensStorage model)
export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  type: integer("type").notNull(), // Updated to integer for enum compatibility
  token: text("token").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define relations for tokens
export const tokensRelations = relations(tokens, ({ one }) => ({
  user: one(users, {
    fields: [tokens.userId],
    references: [users.id],
  }),
}));

// Refresh tokens table (corresponding to RefreshTokenStorage model)
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token").notNull(),
});

// Define relations for refresh tokens
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

// User preferences table (corresponding to UserPreference model)
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  data: jsonb("data").notNull().default({}),
});

// Define relations for user preferences
export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userPreferences.userId],
      references: [users.id],
    }),
  })
);

export const messagesSummary = pgTable(
  "messages_summary",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    pendingWork: text("pending_work"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),

    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
  },
  (table) => [
    index("embeddingIndex").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  ]
);

export const messagesSummaryRelations = relations(
  messagesSummary,
  ({ one }) => ({
    user: one(users, {
      fields: [messagesSummary.userId],
      references: [users.id],
    }),
  })
);
