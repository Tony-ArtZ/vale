export type WebSocketRequest = {
  type: "AUTH" | "RESULT" | "HEARTBEAT";
  id: string;
  token: string;
  payload?: {
    message: string;
    success: boolean;
  };
};

export type WebSocketResponse = {
  type: "REQUEST" | "RESULT" | "HEARTBEAT";
  id: string;
  payload: {
    success?: boolean;
    message?: string;
    request?: string;
    parameters?: string;
  };
};

export type PubClientActionRequest = {
  userId: string;
  id: string;
  action: {
    request: string;
    parameters: string;
  };
};

export type PubClientActionResult = {
  userId: string;
  id: string;
  result: {
    success: boolean;
    message: string;
  };
};
