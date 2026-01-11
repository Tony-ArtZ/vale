import { db } from "../db/index.ts";
import { users, userPreferences, refreshTokens } from "shared-db";
import { hashPassword, verifyPassword } from "../utils/password-helper.ts";
import { eq, and } from "drizzle-orm";

export const findUserByEmail = async (email: string) => {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0];
};

export const findUserByUsername = async (username: string) => {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.userName, username))
    .limit(1);
  return result[0];
};

export const findUserById = async (userId: string | number) => {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, Number(userId)))
    .limit(1);
  return result[0];
};

export const createUser = async (
  username: string,
  email: string,
  password: string
) => {
  const hashedPassword = await hashPassword(password);

  // Insert the user and return the result
  const result = await db
    .insert(users)
    .values({
      userName: username,
      email: email,
      password: hashedPassword,
    })
    .returning();

  return result[0];
};

export const validateUserPassword = async (user: any, password: string) => {
  return verifyPassword(password, user.password);
};

export const createUserPreferences = async (userId: number) => {
  return db.insert(userPreferences).values({
    userId: userId.toString(),
    data: {},
  });
};

export const saveRefreshTokenToDb = async (userId: number, token: string) => {
  return db.insert(refreshTokens).values({
    userId: userId.toString(),
    refreshToken: token,
  });
};

export const findRefreshToken = async (userId: string, token: string) => {
  const result = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.userId, userId),
        eq(refreshTokens.refreshToken, token)
      )
    )
    .limit(1);

  return result[0];
};

export const deleteRefreshToken = async (token: string) => {
  return db.delete(refreshTokens).where(eq(refreshTokens.refreshToken, token));
};
