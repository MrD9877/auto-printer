import dotenv from "dotenv";
import fs from "fs";

dotenv.config();
const envPath = "./.env";
const env = dotenv.parse(fs.readFileSync(envPath));

export function changeURL(url: string) {
  env.URL = url;
  const newContent = Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  fs.writeFileSync(envPath, newContent);
  console.log("✅ .env updated");
  console.log(process.env.URL);
}

console.log(env);
