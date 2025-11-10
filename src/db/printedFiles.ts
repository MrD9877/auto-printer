import fs from "fs";

const filePath = "./printedFiles.json";
export function writeNewFilename(filename: string) {
  let printedFiles: string[] = [];
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    printedFiles = JSON.parse(data.toString()) as string[];
    const findDublicate = printedFiles.find((name) => name === filename);
    if (!findDublicate) {
      printedFiles.push(filename);
    }
  } else {
    printedFiles.push(filename);
  }
  fs.writeFileSync(filePath, JSON.stringify(printedFiles));
}

export function ischeckFileName(filename: string) {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    const printedFiles = JSON.parse(data.toString()) as string[];
    const findFileName = printedFiles.find((name) => name === filename);
    if (findFileName) return true;
  }
  return false;
}
