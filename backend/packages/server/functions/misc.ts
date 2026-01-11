import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { db } from "../db";
import {
  and,
  cosineDistance,
  desc,
  eq,
  gt,
  messagesSummary,
  sql,
} from "shared-db";

export const getCurrentWeather = async ({
  city,
  username,
}: {
  city: string;
  username: string;
}) => {
  try {
    const response = await fetch(
      `http://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_KEY}&q=${city}&aqi=no`
    );
    if (response.status !== 200) {
      return {
        success: false,
        message: "Failed to get current weather",
        username,
      };
    }

    const data = await response.json();
    return {
      success: true,
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
      },
      current: {
        condition: data.current.condition.text,
        tempC: data.current.temp_c,
        feelsLikeC: data.current.feelslike_c,
        humidity: data.current.humidity,
        windKph: data.current.wind_kph,
      },
      username,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "An error occurred while getting weather data",
      error: err instanceof Error ? err.message : String(err),
      username,
    };
  }
};

export const getForecastWeather = async ({
  city,
  username,
}: {
  city: string;
  username: string;
}) => {
  try {
    const response = await fetch(
      `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_KEY}&q=${city}&days=1&aqi=no`
    );
    if (response.status !== 200) {
      return {
        success: false,
        message: "Failed to get forecast weather",
        username,
      };
    }

    const data = await response.json();
    return {
      success: true,
      location: {
        name: data.location.name,
        region: data.location.region,
        country: data.location.country,
      },
      forecast: {
        condition: data.forecast.forecastday[0].day.condition.text,
        chanceOfRain: data.forecast.forecastday[0].day.daily_chance_of_rain,
        maxTempC: data.forecast.forecastday[0].day.maxtemp_c,
        minTempC: data.forecast.forecastday[0].day.mintemp_c,
      },
      username,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "An error occurred while getting forecast data",
      error: err instanceof Error ? err.message : String(err),
      username,
    };
  }
};

export const orderPizza = async ({
  specifcs = "",
  username,
}: {
  specifcs?: string;
  username: string;
}) => {
  try {
    const response = await fetch(
      "https://1946-2a09-bac1-36c0-60-00-10d-2a.ngrok-free.app/trigger-order",
      {
        method: "POST",
        body: JSON.stringify({
          passcode: "pizzapizza",
          specifics: specifcs,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    console.log(data);

    if (!data.success) {
      return {
        success: false,
        message: "Failed to order pizza",
        username,
      };
    }

    return {
      success: true,
      message: "Your pizza is on the way!",
      username,
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "An error occurred while ordering pizza",
      error: err instanceof Error ? err.message : String(err),
      username,
    };
  }
};

export const findRelevantConversation = async ({
  userId,
  keywords,
}: {
  userId: string;
  keywords: string;
}) => {
  try {
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-ada-002"),
      value: keywords,
    });

    const similarity = sql<number>`1 - (${cosineDistance(
      messagesSummary.embedding,
      embedding
    )})`;

    const data = await db
      .select({
        title: messagesSummary.title,
        summary: messagesSummary.summary,
        similarity,
      })
      .from(messagesSummary)
      .where(and(eq(messagesSummary.userId, userId), gt(similarity, 0.5)))
      .orderBy((t) => desc(t.similarity))
      .limit(3);

    return data;
  } catch (err) {
    console.error("Error getting previous context:", err);
    return {
      success: false,
      message: "Failed to get previous context",
      error: err instanceof Error ? err.message : String(err),
    };
  }
};
