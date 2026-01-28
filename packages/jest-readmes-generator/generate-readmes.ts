import * as fs from "fs";
import { generateReadmeForPackage } from "./generator";
import packageNames from "./jest-readme-packages";

async function main() {
  for (const packageName of packageNames) {
    const { readme, readmePath } = await generateReadmeForPackage(packageName);
    fs.writeFileSync(readmePath, readme, "utf-8");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
