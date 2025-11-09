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
writeHistoryId("3983");
