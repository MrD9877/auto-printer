import dotenv from "dotenv";

import { Buffer } from "buffer";
import { gmail_v1, google } from "googleapis";
import { GaxiosResponse } from "gaxios";
import fs from "fs";

dotenv.config();

const token = JSON.parse(fs.readFileSync("./token.json", "utf8"));
const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_ID, process.env.GOOGLE_SECRET, "https://fjdhtm4n-3001.inc1.devtunnels.ms/");
oAuth2Client.setCredentials(token);

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

function decodeBase64url(str: string) {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

async function getData() {
  const newmessage = await gmail.users.messages.get({ userId: "me", id: "19a66eee983e7890" });
  const parts = newmessage.data.payload.parts;
  let plainText = "";
  let htmlText = "";
  let subject = "";
  let from = "";
  const headers = newmessage.data.payload.headers;
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].name === "Subject") {
      subject = headers[i].value;
    }
    if (headers[i].name === "From") {
      from = headers[i].value;
    }
  }
  for (const part of parts) {
    if (part.mimeType === "text/plain") {
      plainText = decodeBase64url(part.body.data)
        .replace(/[\r\n]+/g, "")
        .trim();
    } else if (part.mimeType === "text/html") {
      htmlText = decodeBase64url(part.body.data)
        .replace(/[\r\n]+/g, "")
        .trim();
    }
  }

  console.log({ plainText, htmlText, from, subject });
}
getData().catch(console.error);
