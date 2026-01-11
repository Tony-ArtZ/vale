import { db } from "../db/index.ts";
import { type InferSelectModel } from "drizzle-orm";
import { eq, userPreferences } from "shared-db";

type UserPreference = InferSelectModel<typeof userPreferences>;
type UserPreferenceData = Record<string, any>;

async function addOrUpdatePreferenceHelper(
  userId: string | number,
  key: string,
  value: any
): Promise<UserPreference> {
  // Check if record already exists
  const existingPref = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId.toString()))
    .limit(1);

  if (existingPref.length > 0) {
    // Update existing record
    const currentData = (existingPref[0].data as UserPreferenceData) || {};
    const updatedData = { ...currentData, [key]: value };

    await db
      .update(userPreferences)
      .set({ data: updatedData })
      .where(eq(userPreferences.userId, userId.toString()));

    return { ...existingPref[0], data: updatedData };
  } else {
    // Insert new record
    const newData = { [key]: value } as UserPreferenceData;

    const result = await db
      .insert(userPreferences)
      .values({ userId: userId.toString(), data: newData })
      .returning();

    return result[0];
  }
}

async function deletePreferenceHelper(
  userId: string | number,
  key: string
): Promise<UserPreference | null> {
  const existingPref = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId.toString()))
    .limit(1);

  if (existingPref.length > 0) {
    const currentData = (existingPref[0].data as UserPreferenceData) || {};
    const { [key]: removedValue, ...updatedData } = currentData;

    await db
      .update(userPreferences)
      .set({ data: updatedData })
      .where(eq(userPreferences.userId, userId.toString()));

    return { ...existingPref[0], data: updatedData };
  }

  return null;
}

async function getAllPreferences(
  userId: string | number
): Promise<UserPreferenceData> {
  const result = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId.toString()))
    .limit(1);

  return result.length > 0 ? (result[0].data as UserPreferenceData) : {};
}

export {
  addOrUpdatePreferenceHelper,
  deletePreferenceHelper,
  getAllPreferences,
  type UserPreference,
  type UserPreferenceData,
};
