import { Service } from "node-windows";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svc = new Service({
  name: "AutoPrint",
  script: path.join(__dirname, "dist", "server.js"),
});

svc.on("uninstall", () => console.log("🧹 Service uninstalled"));
svc.uninstall();
