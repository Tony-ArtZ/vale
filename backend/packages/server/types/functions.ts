// Base types for function parameters and responses
export interface BaseFunctionParams {
  userId?: string;
  token?: string;
  username: string;
  argumentsJson: string;
}

export interface BaseFunctionResponse {
  role: string;
  content: string;
  animation?: string;
}

// Specific argument types
export interface WeatherArguments {
  city: string;
}

export interface PizzaArguments {
  specifics?: string;
}

export interface TrackArguments {
  track: string;
}

export interface GenreArguments {
  genre: string;
}

export interface PreferenceUpdateArguments {
  key: string;
  value: string;
  content: string;
}

export interface PreferenceDeleteArguments {
  key: string;
  content: string;
}

export interface AnimationArguments {
  animationName: string;
  content: string;
}
