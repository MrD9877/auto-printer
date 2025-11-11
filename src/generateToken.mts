// auto-get-token.js
import http from "http";
import open from "open"; // npm i open
import fs from "fs/promises";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();
console.log(process.env.GOOGLE_ID);
const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_ID, process.env.GOOGLE_SECRET, process.env.REDIRECT_URI);
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, process.env.REDIRECT_URI);
  const code = url.searchParams.get("code");
  if (!code) {
    res.end("No code in query string");
    return;
  }
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    await fs.writeFile("token.json", JSON.stringify(tokens));
    res.end("Authentication successful! You can close this tab.");
    console.log("Token stored to token.json");
  } catch (err) {
    console.error("Error retrieving access token", err);
    res.end("Error retrieving access token");
  } finally {
    // close server after handling
    setTimeout(() => server.close(), 1000);
  }
});

server.listen(3000, () => {
  console.log("Opening browser for authentication...");
  console.log(authUrl);
  open(authUrl); // opens the URL in default browser
});
