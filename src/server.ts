import dotenv from "dotenv";
import express from "express";

import { Buffer } from "buffer";
import { gmail_v1, google } from "googleapis";
import fs from "fs";
import { getHistoryId, writeHistoryId } from "./action/historyId";
import { Bundle } from "typescript";

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

app.use(
  express.json({
    type: ["application/json", "text/plain"],
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const token = JSON.parse(fs.readFileSync("./token.json", "utf8"));
const oAuth2Client = new google.auth.OAuth2(process.env.GOOGLE_ID, process.env.GOOGLE_SECRET, "https://fjdhtm4n-3001.inc1.devtunnels.ms/");
oAuth2Client.setCredentials(token);

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

function getHistoryIdAndSaveNewHistoryID(message: { data: string }) {
  const decoded = Buffer.from(message.data, "base64").toString("utf8");
  const data = JSON.parse(decoded);
  const newHistoryID = data.historyId;
  const oldHistoryId = getHistoryId();
  writeHistoryId(`${newHistoryID}`);
  return oldHistoryId;
}

function decodeBase64url(str: string) {
  return Buffer.from(str.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function decodeBase64urlToBuffer(base64url: string) {
  // Gmail uses base64url (different from standard base64)
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64");
}

async function getImagePart(part: gmail_v1.Schema$MessagePart, id: string) {
  let imgData: Buffer;
  const images = [];

  if (part.body.data) {
    imgData = decodeBase64urlToBuffer(part.body.data);
  } else if (part.body.attachmentId) {
    // 🔥 fetch the attachment data using the attachmentId
    const attachment = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: id,
      id: part.body.attachmentId,
    });
    imgData = decodeBase64urlToBuffer(attachment.data.data);
  }

  images.push({
    mimeType: part.mimeType,
    filename: part.filename || "unnamed",
    data: imgData,
  });
  return images;
}

async function getData(id: string) {
  const newmessage = await gmail.users.messages.get({ userId: "me", id });
  const parts = newmessage.data.payload.parts;
  let plainText = "";
  let htmlText = "";
  let subject = "";
  let from = "";
  let images = [];
  let pdf = [];
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
    // handle any image type (png, jpeg, etc.)
    if (part.mimeType.startsWith("image/")) {
      images = await getImagePart(part, id);
    }
    if (part.mimeType === "application/pdf") {
      pdf = await getImagePart(part, id);
    }
  }
  if (images && images.length > 0 && images[0].filename) {
    fs.writeFileSync(`./${images[0].filename}`, images[0].data);
  }
  if (pdf && pdf.length > 0) {
    fs.writeFileSync(`./${pdf[0].filename}`, pdf[0].data);
  }

  console.log({ plainText, htmlText, from, subject, images });
}

function getMessageIds(historyList: gmail_v1.Schema$History[]) {
  const messageIds: string[] = [];
  if (!historyList || historyList.length < 1) return messageIds;
  for (let i = 0; i < historyList.length; i++) {
    if (historyList[i]?.messagesAdded) {
      const messagesAdded = historyList[i]?.messagesAdded;
      for (let j = 0; j < messagesAdded.length; j++) {
        const messageId = messagesAdded[j].message?.id;
        messageIds.push(messageId);
      }
    }
  }
  return messageIds;
}

async function getMails(messagesIds: string[]) {
  for (let i = 0; i < messagesIds.length; i++) {
    await getData(messagesIds[i]);
  }
}

app.post("/gmail/notifications", async (req, res) => {
  try {
    console.log("you have a mail!!");
    const message = req.body?.message;
    if (!message?.data) {
      console.log("⚠️ Empty message:", req.body);
      return res.sendStatus(204);
    }
    const historyId = getHistoryIdAndSaveNewHistoryID(message);
    const history = await gmail.users.history.list({
      userId: "me",
      startHistoryId: historyId, // from your notification
    });
    const historyList = history.data.history;
    console.log(historyList);
    const messageIds = getMessageIds(historyList);
    await getMails(messageIds);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error handling Gmail notification:", err);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port} in ${process.env.NODE_ENV || "DEV"}`);
});
