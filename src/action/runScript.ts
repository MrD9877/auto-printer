import { execSync } from "child_process";
import path from "path";

const folderpath = path.join(__dirname, "..");

export async function runScript() {
  try {
    // console.log("Running generatetoken.mjs...");
    // execSync(`node ${path.join(folderpath, "generatetoken.mjs")}`, { stdio: "inherit" });

    console.log("Running index.js...");
    execSync(`node ${path.join(folderpath, "index.js")} stop`, { stdio: "inherit" });
    execSync(`node ${path.join(folderpath, "index.js")} start`, { stdio: "inherit" });
  } catch (err) {
    console.error("Error running pre-service scripts:", err);
    process.exit(1);
  }
}
