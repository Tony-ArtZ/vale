export interface User {
  userId: string;
  userName: string;
  email?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface WebSocketMessage {
  type: "AUTH" | "HEARTBEAT" | "RESULT" | "REQUEST";
  id?: string;
  token?: string;
  payload?: any;
}
