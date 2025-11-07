import dotenv from "dotenv";
import express from "express";
import cors, { CorsOptions } from "cors";

import { Buffer } from "buffer";
import { gmail_v1, google } from "googleapis";
import { GaxiosResponse } from "gaxios";
import fs from "fs";

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [process.env.ORIGIN_ONE, process.env.ORIGIN_TWO];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

// app.options("*", cors(corsOptions));
// if (process.env.NODE_ENV === "production") {
//   app.set("trust proxy", 1);
// }

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

async function getMail(history: GaxiosResponse<gmail_v1.Schema$ListHistoryResponse>) {
  const addedMessages = history.data.history?.flatMap((h) => h.messagesAdded?.map((m) => m.message?.id)) || [];

  for (const id of addedMessages) {
    console.log({ id });
    const msg = await gmail.users.messages.get({
      userId: "me",
      id: id,
    });

    // --- Extract headers ---
    const headers = msg.data.payload?.headers || [];
    if (headers.length === 0) console.log("header is empty");
    const subject = headers.find((h) => h.name === "Subject")?.value || "(No Subject)";
    const from = headers.find((h) => h.name === "From")?.value || "(Unknown Sender)";

    // --- Extract body ---
    function getBody(payload) {
      if (!payload) return "";

      const bodyData = payload.body?.data;
      if (bodyData) {
        return Buffer.from(bodyData, "base64").toString("utf8");
      }

      if (payload.parts?.length) {
        for (const part of payload.parts) {
          const text = getBody(part);
          if (text) return text;
        }
      }

      return "";
    }

    const body = getBody(msg.data.payload);

    console.log("📧 From:", from);
    console.log("📝 Subject:", subject);
    console.log("📄 Body:", body.slice(0, 300)); // Limit output length
  }
}

app.post("/gmail/notifications", async (req, res) => {
  try {
    const message = req.body?.message;
    console.log(JSON.stringify(message));
    if (!message?.data) {
      console.log("⚠️ Empty message:", req.body);
      return res.sendStatus(204);
    }

    // 🔹 Decode Base64 → JSON
    const decoded = Buffer.from(message.data, "base64").toString("utf8");
    const data = JSON.parse(decoded);
    console.log("📨 Decoded Gmail notification:", data);

    // 🔹 Fetch new messages since this historyId
    const history = await gmail.users.history.list({
      userId: "me",
      startHistoryId: data.historyId,
    });
    // await getMail(history as unknown as GaxiosResponse<gmail_v1.Schema$ListHistoryResponse>);
    await history.data.history.map(async (data) => {
      await data.messagesAdded?.map(async (message) => {
        if (message.message) {
          const msg = await gmail.users.messages.get({
            userId: "me",
            id: message.message.id,
          });
          console.log({ msg: await msg.json() });
        }
      });
    });
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error handling Gmail notification:", err);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port} in ${process.env.NODE_ENV || "DEV"}`);
});
