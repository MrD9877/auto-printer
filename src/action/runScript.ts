import { execSync } from "child_process";
import path from "path";

const filePath = path.join(process.cwd(), "dist", "index.js");
export async function runScript() {
  try {
    // console.log("Running generatetoken.mjs...");
    // execSync(`node ${path.join(folderpath, "generatetoken.mjs")}`, { stdio: "inherit" });

    console.log("Running index.js...");
    execSync(`node ${filePath} stop`, { stdio: "inherit" });
    execSync(`node ${filePath} start`, { stdio: "inherit" });
  } catch (err) {
    console.error("Error running pre-service scripts:", err);
    process.exit(1);
  }
}
