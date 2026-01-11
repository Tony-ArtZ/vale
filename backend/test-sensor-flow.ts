import { WebSocket } from "ws";

// Configuration
const API_URL = "http://localhost:3000";
const WS_URL = "ws://localhost:8081";

async function main() {
  console.log("🧪 Starting Sensor Data Flow Test...");

  // 1. Register a temporary user
  const email = `test-${Date.now()}@example.com`;
  const password = "password123";
  const userName = `User${Date.now()}`;

  console.log(`\n1. Registering user: ${email}...`);
  const regRes = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, userName }),
  });

  if (!regRes.ok) {
    throw new Error(`Registration failed: ${await regRes.text()}`);
  }

  const { accessToken, user } = await regRes.json();
  console.log("✅ User registered. ID:", user.id);

  // 2. Connect to WebSocket
  console.log(`\n2. Connecting to WebSocket (${WS_URL})...`);
  const ws = new WebSocket(WS_URL);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("WS Connection timeout")),
      5000
    );

    ws.on("open", () => {
      clearTimeout(timeout);
      console.log("✅ WebSocket Connected");

      // Send Auth
      console.log("Sending Auth Token...");
      ws.send(
        JSON.stringify({
          type: "AUTH",
          id: "auth-1",
          token: accessToken,
        })
      );
      resolve();
    });

    ws.on("error", reject);
  });

  // 3. Setup Listener for VITALS
  const vitalsPromise = new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("Timeout waiting for VITALS")),
      10000
    );

    ws.on("message", (data) => {
      const msg = JSON.parse(data.toString());
      console.log("📩 Received WS Message:", msg.type);

      if (msg.type === "VITALS") {
        clearTimeout(timeout);
        console.log("✅ Received VITALS update matching sent data!");
        console.log("Payload:", msg.payload);
        resolve(msg.payload);
      }
    });
  });

  // 4. Send Sensor Data via API
  console.log(
    `\n3. Sending Sensor Data via API to ${API_URL}/interrupt/sensor...`
  );
  const sensorPayload = {
    heartRate: 88,
    spo2: 99,
    stress: "MED",
  };

  const postRes = await fetch(`${API_URL}/interrupt/sensor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(sensorPayload),
  });

  if (!postRes.ok) {
    throw new Error(`Sensor POST failed: ${await postRes.text()}`);
  }
  console.log("✅ Sensor Data Posted Successfully");

  // 5. Verify Receipt
  console.log(`\n4. Waiting for WebSocket broadcast...`);
  const receivedVitals = await vitalsPromise;

  // Cleanup
  ws.close();

  // Validation
  if (receivedVitals.heartRate !== sensorPayload.heartRate) {
    throw new Error("Mismatch in heart rate data!");
  }

  console.log("\n🎉 TEST PASSED: End-to-end sensor flow is working!");
}

main().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
