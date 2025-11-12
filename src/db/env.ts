// import dotenv from "dotenv";
import fs from "fs";
import path from "path";
const secretPath = path.join(process.cwd(), "secret.json");

export function changeURL(url: string) {
  const secret = JSON.parse(fs.readFileSync(secretPath, "utf8"));
  secret.URL = url;
  fs.writeFileSync(secretPath, JSON.stringify(secret, null, 2));
}

export function getSecret() {
  const secret = JSON.parse(fs.readFileSync(secretPath, "utf8"));
  return secret;
}
