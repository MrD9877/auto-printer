import { Service } from "node-windows";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the full path to your compiled server script
const svc = new Service({
  name: "AutoPrint",
  description: "Runs a local print server",
  script: path.join(__dirname, "dist", "server.mjs"), // <- full path automatically
});

// Listen for events so you know what’s happening
svc.on("install", () => {
  console.log("✅ Service installed successfully!");
  svc.start();
});

svc.on("alreadyinstalled", () => console.log("⚠️ Service already installed"));
svc.on("start", () => console.log("🚀 Service started"));
svc.on("error", (err) => console.error("❌ Error:", err));

svc.install();
