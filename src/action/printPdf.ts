import { print } from "pdf-to-printer";
import fs from "fs";
import path from "path";
import { Media } from "../server.js";

export async function printPdf(pdf: Media, printer?: string, paperSize?: string, silent?: boolean) {
  const filePath = path.resolve("./downloads", pdf.filename);
  fs.writeFileSync(filePath, pdf.data);
  await print(filePath, {
    printer, // optional printer name
    paperSize,
    silent,
  });
}
