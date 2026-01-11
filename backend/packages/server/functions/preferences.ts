import {
  addOrUpdatePreferenceHelper,
  deletePreferenceHelper,
} from "../utils/user-prefs-helper.ts";

export const updatePreference = async ({
  userId,
  key,
  value,
  content,
  username,
}: {
  userId: string;
  key: string;
  value: string;
  content: string;
  username: string;
}) => {
  try {
    const result = await addOrUpdatePreferenceHelper(userId, key, value);
    return {
      success: true,
      key,
      value,
      message: content,
      username,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "Failed to update preference",
      error: err instanceof Error ? err.message : String(err),
      username,
    };
  }
};

export const deletePreference = async ({
  userId,
  key,
  content,
  username,
}: {
  userId: string;
  key: string;
  content: string;
  username: string;
}) => {
  try {
    const result = await deletePreferenceHelper(userId, key);
    return {
      success: true,
      key,
      message: content,
      username,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "Failed to delete preference",
      error: err instanceof Error ? err.message : String(err),
      username,
    };
  }
};
