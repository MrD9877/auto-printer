import { google } from "googleapis";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const args = process.argv.slice(2); // skip ["node", "dist/server.mjs"]
const value = args[0]; // "value"

const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_ID, process.env.GOOGLE_SECRET, process.env.URL);

// After getting token manually once
const tokenJson = fs.readFileSync("./token.json");
oAuth2Client.setCredentials(JSON.parse(tokenJson.toString()));

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

async function startWatch() {
  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName: "projects/print-auto-9000/topics/Auto-Print",
    },
  });
  console.log("Watch response:", res.data);
}
async function stopWatch() {
  const res = await gmail.users.stop({
    userId: "me",
  });
  console.log(res.data);
}

if (value === "stop") {
  stopWatch();
} else if (value === "start") {
  startWatch();
}
