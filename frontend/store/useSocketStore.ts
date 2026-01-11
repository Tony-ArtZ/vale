import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";

interface SocketState {
  isConnected: boolean;
  socket: WebSocket | null;
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (type: string, payload: any) => void;
  reconnect: (url: string) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  isConnected: false,
  socket: null,

  connect: (url) => {
    const { socket } = get();
    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    )
      return;

    // Check if user is authenticated before connecting
    const { accessToken, isAuthenticated } = useAuthStore.getState();
    if (!accessToken || !isAuthenticated) {
      console.log("WS: Not authenticated, skipping connection");
      return;
    }

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("WS Connected");
      set({ isConnected: true });

      // Send auth message on connect
      const token = useAuthStore.getState().accessToken;
      if (token) {
        ws.send(
          JSON.stringify({
            type: "AUTH",
            id: Math.random().toString(36).substring(7),
            token: token,
            payload: {},
          })
        );
      }
    };

    ws.onclose = (event) => {
      console.log("WS Disconnected", event.code, event.reason);
      set({ isConnected: false, socket: null });

      // If closed due to auth error (code 4001 or 4003), don't auto-reconnect
      // These codes would need to be implemented on the server side
      if (event.code === 4001 || event.code === 4003) {
        console.log("WS: Auth failed, logging out");
        useAuthStore.getState().logout();
      }
    };

    ws.onerror = (e) => {
      console.error("WS Error", e);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle auth error messages from server
        if (data.type === "AUTH_ERROR" || data.type === "UNAUTHORIZED") {
          console.log("WS: Received auth error, attempting token refresh");
          useAuthStore
            .getState()
            .refreshAccessToken()
            .then((success) => {
              if (success) {
                // Reconnect with new token
                get().reconnect(url);
              }
            });
        }
      } catch (e) {
        // Not JSON or other error, ignore
      }
    };

    set({ socket: ws });
  },

  reconnect: (url) => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({ isConnected: false, socket: null });
    // Small delay before reconnecting
    setTimeout(() => {
      get().connect(url);
    }, 100);
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
    }
    set({ isConnected: false, socket: null });
  },

  sendMessage: (type, payload) => {
    const { socket } = get();
    if (socket && socket.readyState === WebSocket.OPEN) {
      const token = useAuthStore.getState().accessToken;
      socket.send(
        JSON.stringify({
          type,
          id: Math.random().toString(36).substring(7),
          token: token || "",
          payload,
        })
      );
    } else {
      console.warn("WS: Cannot send message, socket not open");
    }
  },
}));

// Subscribe to auth store changes - disconnect when logged out
useAuthStore.subscribe((state, prevState) => {
  if (prevState.isAuthenticated && !state.isAuthenticated) {
    console.log("WS: User logged out, disconnecting");
    useSocketStore.getState().disconnect();
  }
});
