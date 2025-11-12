import express from "express";

import { Buffer } from "buffer";
import { gmail_v1, google } from "googleapis";
import fs from "fs";
import { decodeBase64url, decodeBase64urlToBuffer } from "./action/decode.js";
import { getHistoryIdAndSaveNewHistoryID } from "./db/historyId.js";
import { ischeckFileName, writeNewFilename } from "./db/printedFiles.js";
import { printPdf } from "./action/printPdf.js";
import { forwardPort } from "./action/forwartPort.js";
import { runScript } from "./action/runScript.js";
import { getSecret } from "./db/env.js";
import path from "path";

export type Media = {
  mimeType: string;
  filename: string;
  data: Buffer<ArrayBufferLike>;
};
const secret = getSecret();

const port = Number(secret.PORT) || 3001;
const PRINT_SUBJECT_STRING = "print9000";

const app = express();
console.log(path.join(process.cwd(), "dist", "index.js"));

app.use(
  express.json({
    type: ["application/json", "text/plain"],
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});
let url = "";

async function initFn() {
  url = await forwardPort(port);
  await runScript();
}

const token = JSON.parse(fs.readFileSync("./token.json", "utf8"));
const oAuth2Client = new google.auth.OAuth2(secret.GOOGLE_ID, secret.GOOGLE_SECRET, url);
oAuth2Client.setCredentials(token);

const gmail = google.gmail({ version: "v1", auth: oAuth2Client });

async function getMediaPart(part: gmail_v1.Schema$MessagePart, id: string) {
  let mediaData: Buffer;
  const media: Media[] = [];

  if (part.body.data) {
    mediaData = decodeBase64urlToBuffer(part.body.data);
  } else if (part.body.attachmentId) {
    // 🔥 fetch the attachment data using the attachmentId
    const attachment = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId: id,
      id: part.body.attachmentId,
    });
    mediaData = decodeBase64urlToBuffer(attachment.data.data);
  }

  media.push({
    mimeType: part.mimeType,
    filename: part.filename || "unnamed",
    data: mediaData,
  });
  return media;
}

async function checkAndPrintPdf(pdf: Media) {
  const isAlreadyPrinted = ischeckFileName(pdf.filename);
  if (!isAlreadyPrinted) return;
  else {
    await printPdf(pdf);
    writeNewFilename(pdf.filename);
  }
}

async function getData(id: string) {
  const newmessage = await gmail.users.messages.get({ userId: "me", id });
  const parts = newmessage.data.payload.parts;
  let plainText = "";
  let subject = "";
  let from = "";
  let pdfs: Media[] = [];
  //// headers from and subject
  const headers = newmessage.data.payload.headers;
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].name === "Subject") {
      subject = headers[i].value;
    }
    if (headers[i].name === "From") {
      from = headers[i].value;
    }
  }

  // body text and media
  for (const part of parts) {
    if (part.mimeType === "text/plain") {
      plainText = decodeBase64url(part.body.data)
        .replace(/[\r\n]+/g, "")
        .trim();
    }
    if (part.mimeType === "application/pdf") {
      pdfs = await getMediaPart(part, id);
    }
  }

  // if (pdf && pdf.length > 0) {
  //   fs.writeFileSync(`./storage/pdf/${pdf[0].filename}`, pdf[0].data);
  // }

  if (pdfs && pdfs.length > 0 && subject === PRINT_SUBJECT_STRING) {
    for (let i = 0; i < pdfs.length; i++) {
      await checkAndPrintPdf(pdfs[i]);
    }
  }

  console.log({ plainText, from, subject });
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
    const messageIds = getMessageIds(historyList);
    await getMails(messageIds);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error handling Gmail notification:", err);
    res.sendStatus(500);
  }
});

app.listen(port, async () => {
  console.log(`Example app listening on port ${port} in ${secret.NODE_ENV || "DEV"}`);
  initFn();
});
