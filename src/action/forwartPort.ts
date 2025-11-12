import localtunnel from "localtunnel";
import { changeURL } from "../db/updateEnv.js";

export async function forwardPort(port: number) {
  try {
    console.log("jbsjdb");
    const tunnel = await localtunnel({ port });
    const url = tunnel.url;
    console.log(`Public URL: ${url}`);
    changeURL(url);

    tunnel.on("close", () => console.log("Tunnel closed"));
    return url;
  } catch (err) {
    console.error("❌ LocalTunnel error:", err);
  }
}
