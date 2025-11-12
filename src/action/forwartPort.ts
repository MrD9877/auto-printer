import ngrok from "ngrok";
import { getSecret } from "../db/env";
import { execSync } from "child_process";
const secret = getSecret();

export async function forwardPort(port: number) {
  console.log({ port: secret.PORT, sec: secret.NGROK_SECRET });
  try {
    // execSync("taskkill /F /IM ngrok.exe");
    await ngrok.disconnect(); // disconnect all tunnels
    await ngrok.kill();
    const url = await ngrok.connect({
      subdomain: "alex",
      addr: 8080,
      authtoken: secret.NGROK_SECRET,
    });
    return url;
  } catch (err) {
    console.error("❌ LocalTunnel error:", err);
  }
}
forwardPort(7777);
