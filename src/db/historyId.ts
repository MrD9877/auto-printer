import fs from "fs";

const historyIdFilePath = "./historyId.json";
export function getHistoryId() {
  const data = fs.readFileSync(historyIdFilePath);
  const historyId = JSON.parse(data.toString()).historyId as string;
  return historyId;
}

export async function writeHistoryId(id: string) {
  const data = { historyId: id };
  fs.writeFileSync(historyIdFilePath, JSON.stringify(data, null, 2));
}
export function getHistoryIdAndSaveNewHistoryID(message: { data: string }) {
  const decoded = Buffer.from(message.data, "base64").toString("utf8");
  const data = JSON.parse(decoded);
  const newHistoryID = data.historyId;
  const oldHistoryId = getHistoryId();
  writeHistoryId(`${newHistoryID}`);
  return oldHistoryId;
}
