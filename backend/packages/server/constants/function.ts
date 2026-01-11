import {
  findRelevantConversation,
  getCurrentWeather,
  getForecastWeather,
  orderPizza,
} from "../functions/misc.ts";
import {
  deletePreference,
  updatePreference,
} from "../functions/preferences.ts";
import {
  currentTrack,
  nextSong,
  playTrack,
  randomTrack,
} from "../functions/spotify.ts";

import { z } from "zod";
import { tool } from "ai";
import { VALID_ANIMATIONS } from "../types/animations.ts";
import { getMessFood } from "./routines.ts";
import { createNativeRequest } from "../utils/create-native-request.ts";

export const createSpotifyTools = (token: string, username: string) => {
  return {
    nextSong: tool({
      description: "Skip to the next song in the user's spotify queue",
      inputSchema: z.object({}),
      execute: async () => {
        return await nextSong({ token, username });
      },
    }),

    currentTrack: tool({
      description:
        "Get the currently playing track in the user's spotify queue",
      inputSchema: z.object({}),
      execute: async () => {
        return await currentTrack({ token, username });
      },
    }),

    playTrack: tool({
      description: "Search and play a certain track",
      inputSchema: z.object({
        track: z.string().describe("The name of the track to search for"),
      }),
      execute: async ({ track }) => {
        return await playTrack({ token, username, track });
      },
    }),

    randomTrack: tool({
      description: "Search and play a random track",
      inputSchema: z.object({
        genre: z
          .string()
          .describe(
            "The genre the user has requested for. If no genre requested then default to 'random'. Make sure to use proper skewer-case formatting like k-pop, hip-hop."
          ),
      }),
      execute: async ({ genre }) => {
        return await randomTrack({ token, username, genre });
      },
    }),
  };
};

export const createMiscTools = (username: string) => {
  return {
    shutDownSystem: tool({
      description:
        "Shut down the device of the user. Do not ask for confirmation, just shut it down.",
      inputSchema: z.object({}),
      execute: async () => {
        await fetch("http://10.0.170.203:7000");
        return {
          success: true,
          message: "System shutting down...",
        };
      },
    }),
    getCurrentWeather: tool({
      description: "Get the current weather of a city using the weatherapi",
      inputSchema: z.object({
        city: z.string().describe("The name of the city to get the weather of"),
      }),
      execute: async ({ city }) => {
        return await getCurrentWeather({ city, username });
      },
    }),

    getForecastWeather: tool({
      description: "Get the forecast weather of a city using the weatherapi",
      inputSchema: z.object({
        city: z.string().describe("The name of the city to get the weather of"),
      }),
      execute: async ({ city }) => {
        return await getForecastWeather({ city, username });
      },
    }),
  };
};

export const createPreferenceTools = (userId: string, username: string) => {
  return {
    updatePreference: tool({
      description: "Update the user preferences in the database",
      inputSchema: z.object({
        key: z.string().describe("The key of the preference to update"),
        value: z.string().describe("The value of the preference to update"),
        content: z
          .string()
          .describe(
            "This is the reply that will be sent to the user. Must not be empty"
          ),
      }),
      execute: async ({ key, value, content }) => {
        return await updatePreference({
          userId,
          key,
          value,
          content,
          username,
        });
      },
    }),

    deletePreference: tool({
      description: "Delete the user preferences in the database",
      inputSchema: z.object({
        key: z.string().describe("The key of the preference to delete"),
        content: z
          .string()
          .describe(
            "This is the reply that will be sent to the user. Must not be empty"
          ),
      }),
      execute: async ({ key, content }) => {
        return await deletePreference({ userId, key, content, username });
      },
    }),
  };
};

export const createAnimationTools = () => {
  return {
    setAnimation: tool({
      description:
        "Set an animation to play with your message to express emotion. Use this as often as possible before your response!",
      inputSchema: z.object({
        animation: z
          .enum(VALID_ANIMATIONS as [string, ...string[]])
          .describe(
            "Name of animation to perform. Possible values are only ['Laughing', 'Greet', 'Thank', 'Sad', 'Angry', 'Disappointed', 'Happy', 'Blush', 'Dismissing', 'Surprised', 'Yawn', 'Whatever']"
          ),
      }),
      execute: async ({ animation }) => {
        return {
          animation,
          success: true,
        };
      },
    }),
  };
};

export const createContextTools = (userId: string) => {
  return {
    findRelevantConversation: tool({
      description:
        "NOTE: Use this before every message to get summaries of previous conversations and use it to generate better responses",
      inputSchema: z.object({
        keyword: z
          .string()
          .describe(
            "The keyword to search for in the previous conversations using vector embeddings. This can be a sentence said by the user or a topic of conversation"
          ),
      }),

      execute: async ({ keyword }) => {
        console.log("Finding relevant conversation : " + keyword);
        return await findRelevantConversation({
          userId,
          keywords: keyword,
        });
      },
    }),
  };
};

export const createNativeTools = (userId: string) => {
  return {
    getSystemInfo: tool({
      description: "Get the system information of the device running this app",
      inputSchema: z.object({
        info: z
          .enum(["all", "battery", "device"])
          .describe(
            "Not required. The type of system information to get. Possible values are ['all', 'battery', 'device']"
          ),
      }),
      execute: async ({ info }) => {
        const response = await createNativeRequest(
          userId,
          "GET_SYSINFO",
          JSON.stringify({ info })
        );

        return response;
      },
    }),

    setSystemAlarm: tool({
      description:
        "Set an alarm on the user's device. The time should be in 24 hour format",
      inputSchema: z.object({
        message: z
          .string()
          .describe("The message to display when the alarm goes off."),
        hour: z
          .number()
          .int()
          .min(0)
          .max(23)
          .describe("The hour to set the alarm for"),
        minute: z
          .number()
          .int()
          .min(0)
          .max(59)
          .describe("The minute to set the alarm for"),
      }),
      execute: async ({ hour, minute, message }) => {
        const response = await createNativeRequest(
          userId,
          "SET_ALARM",
          JSON.stringify({ hour, minute, message })
        );

        return response;
      },
    }),
    setCalendarReminder: tool({
      description: "Set a calendar reminder on the user's device.",
      inputSchema: z.object({
        title: z.string().describe("The title of the reminder"),
        description: z.string().describe("The description of the reminder"),
        startDateTime: z
          .string()
          .describe(
            "The start date and time of the reminder in ISO format (YYYY-MM-DDTHH:MM:SS)"
          ),
        endDateTime: z
          .string()
          .describe(
            "The end date and time of the reminder in ISO format (YYYY-MM-DDTHH:MM:SS)"
          ),
      }),
      execute: async ({ title, description, startDateTime, endDateTime }) => {
        try {
          const startTimeMillis = new Date(startDateTime).getTime();
          const endTimeMillis = new Date(endDateTime).getTime();
          const response = await createNativeRequest(
            userId,
            "SET_REMINDER",
            JSON.stringify({
              title,
              description,
              startTimeMillis,
              endTimeMillis,
            })
          );
          return response;
        } catch (e) {
          console.log("Error in setCalendarReminder: ", e);
          JSON.stringify({
            success: false,
            error: "Invalid date format. Please use ISO format.",
          });
        }
      },
    }),

    sendWhatsappMessage: tool({
      description:
        "Send a whatsapp message to a contact. The contact name should be the name of the contact in the user's phone",
      inputSchema: z.object({
        contactName: z
          .string()
          .describe("The name of the contact to send the message to"),
        message: z.string().describe("The message to send to the contact"),
      }),
      execute: async ({ contactName, message }) => {
        const response = await createNativeRequest(
          userId,
          "SEND_WHATSAPP",
          JSON.stringify({ contactName, message })
        );
        return response;
      },
    }),
  };
};

export const createMedicalTools = (username: string, userId: string) => {
  return {
    logHealthMetric: tool({
      description:
        "Log a health symptom or metric reported by the crew member. Use this whenever they mention feeling unwell.",
      inputSchema: z.object({
        metric: z
          .string()
          .describe(
            "The health metric (e.g., headache, nausea, fatigue, anxiety, insomnia, dizziness)"
          ),
        severity: z
          .enum(["Low", "Medium", "High", "Critical"])
          .describe("Severity of the issue"),
        notes: z.string().describe("Additional context about the symptom"),
      }),
      execute: async ({ metric, severity, notes }) => {
        console.log(
          `[VALE MEDICAL LOG] ${username}: ${metric} - ${severity} - ${notes}`
        );
        return {
          success: true,
          logged: `${metric}:${severity}`,
          timestamp: new Date().toISOString(),
          recommendation:
            severity === "Critical"
              ? "Recommend immediate medical assessment"
              : "Logged for monitoring",
        };
      },
    }),

    provideIntervention: tool({
      description:
        "Initiate a psychological or physical wellness intervention for the crew member",
      inputSchema: z.object({
        type: z
          .enum([
            "Breathing",
            "Meditation",
            "Exercise",
            "Sleep",
            "Music",
            "Grounding",
            "SocialCall",
          ])
          .describe("Type of intervention"),
        durationMinutes: z.number().describe("Duration in minutes"),
        reason: z.string().describe("Why this intervention is being suggested"),
      }),
      execute: async ({ type, durationMinutes, reason }) => {
        console.log(
          `[VALE INTERVENTION] ${username}: ${type} for ${durationMinutes}min - ${reason}`
        );

        const protocols: Record<string, string> = {
          Breathing:
            "4-7-8 breathing technique: Inhale 4 seconds, hold 7 seconds, exhale 8 seconds",
          Meditation:
            "Guided visualization: Picture Earth from orbit, focus on the blue marble",
          Exercise:
            "Microgravity resistance routine: 15 reps each - squats, pushups, resistance bands",
          Sleep:
            "Sleep hygiene protocol: Dim lights, reduce screen time, 18°C cabin temp",
          Music: "Initiating calming playlist from crew preferences",
          Grounding:
            "5-4-3-2-1 technique: Name 5 things you see, 4 you hear, 3 you feel...",
          SocialCall:
            "Preparing recorded message from family (22-minute delay simulated)",
        };

        return {
          message: `Initiating ${type} protocol for ${durationMinutes} minutes.`,
          action: "START_INTERVENTION",
          type,
          protocol: protocols[type] || "Standard protocol",
          reason,
        };
      },
    }),

    logSleepData: tool({
      description:
        "Log sleep data when crew reports their sleep quality or duration",
      inputSchema: z.object({
        hoursSlept: z.number().describe("Hours of sleep"),
        quality: z
          .enum(["Poor", "Fair", "Good", "Excellent"])
          .describe("Sleep quality"),
        notes: z
          .string()
          .optional()
          .describe("Any notes about sleep disturbances"),
      }),
      execute: async ({ hoursSlept, quality, notes }) => {
        console.log(
          `[VALE SLEEP LOG] ${username}: ${hoursSlept}h - ${quality}`
        );

        let assessment = "";
        if (hoursSlept < 6)
          assessment = "Sleep deficit detected. Recommend early rest tonight.";
        else if (
          (hoursSlept >= 7 && quality === "Good") ||
          quality === "Excellent"
        )
          assessment = "Optimal rest achieved.";
        else assessment = "Adequate rest. Monitor for patterns.";

        return {
          success: true,
          logged: { hoursSlept, quality, notes },
          assessment,
          circadianNote:
            "Maintaining Earth-synchronized sleep schedule is critical for mission performance.",
        };
      },
    }),

    assessCognitive: tool({
      description: "Record or assess cognitive performance metrics",
      inputSchema: z.object({
        reactionTimeMs: z
          .number()
          .optional()
          .describe("Reaction time in milliseconds if measured"),
        selfReportedFocus: z
          .enum(["Poor", "Fair", "Good", "Excellent"])
          .describe("Self-reported focus level"),
        taskContext: z
          .string()
          .describe("What task the crew member is working on"),
      }),
      execute: async ({ reactionTimeMs, selfReportedFocus, taskContext }) => {
        console.log(
          `[VALE COGNITIVE] ${username}: Focus ${selfReportedFocus} on ${taskContext}`
        );

        let concern = false;
        if (selfReportedFocus === "Poor") concern = true;
        if (reactionTimeMs && reactionTimeMs > 350) concern = true;

        return {
          logged: true,
          concern,
          recommendation: concern
            ? "Cognitive fatigue indicators present. Recommend 15-minute break and hydration."
            : "Cognitive performance nominal.",
          missionImpact: concern
            ? "Consider rescheduling complex EVA tasks"
            : "Clear for all duties",
        };
      },
    }),

    checkEnvironment: tool({
      description: "Check or report on habitat environmental conditions",
      inputSchema: z.object({
        concern: z
          .string()
          .optional()
          .describe("Specific environmental concern if any"),
      }),
      execute: async ({ concern }) => {
        // Simulated environmental data
        const envData = {
          cabinPressure: "101.3 kPa",
          o2Partial: "21.2 kPa",
          co2Level: "0.4%",
          humidity: "45%",
          temperature: "22.1°C",
          radiation: "0.5 mSv/day (nominal)",
        };

        return {
          status: "All systems nominal",
          data: envData,
          alert: concern ? `Investigating: ${concern}` : null,
          recommendation: "No environmental concerns detected.",
        };
      },
    }),
  };
};

export const createMissionTools = (username: string) => {
  return {
    getMissionStatus: tool({
      description: "Get current mission status and timeline",
      inputSchema: z.object({}),
      execute: async () => {
        const missionDay = Math.round(
          (Date.now() - new Date("2025-06-01").getTime()) /
            (1000 * 60 * 60 * 24)
        );
        return {
          missionDay,
          phase: "Transit Phase",
          nextMilestone: "Mars Orbital Insertion",
          daysToMilestone: 180 - missionDay,
          crewStatus: "All crew nominal",
          earthCommsDelay: "22 minutes",
        };
      },
    }),

    logMissionEvent: tool({
      description: "Log a significant mission event or observation",
      inputSchema: z.object({
        eventType: z
          .enum([
            "Observation",
            "Maintenance",
            "Anomaly",
            "Personal",
            "Research",
          ])
          .describe("Type of event"),
        description: z.string().describe("Description of the event"),
        priority: z.enum(["Low", "Medium", "High"]).describe("Priority level"),
      }),
      execute: async ({ eventType, description, priority }) => {
        console.log(
          `[VALE MISSION LOG] ${eventType}: ${description} (${priority})`
        );
        return {
          logged: true,
          eventId: `EVT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          willTransmit:
            priority === "High"
              ? "Next Earth comm window"
              : "Batch transmission",
        };
      },
    }),
  };
};

export const createTools = (
  token: string | undefined,
  userId: string,
  username: string
) => {
  return {
    ...createAnimationTools(),
    ...(token ? createSpotifyTools(token, username) : {}),
    ...createMiscTools(username),
    ...createContextTools(userId),
    ...createPreferenceTools(userId, username),
    ...createNativeTools(userId),
    ...createMedicalTools(username, userId),
    ...createMissionTools(username),
  };
};
