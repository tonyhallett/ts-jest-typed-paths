import * as fs from "fs";
import packageNames from "./jest-readme-packages";
import { getReadmePathInfo, generateReadmeForPackage } from "./generator";

async function main() {
  for (const packageName of packageNames) {
    const { readmePath } = getReadmePathInfo(packageName);
    if (!fs.existsSync(readmePath)) {
      fail();
    }

    if (await requiresGeneration(readmePath, packageName)) {
      fail();
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function requiresGeneration(readmePath: string, packageName: string) {
  const currentReadme = fs.readFileSync(readmePath, "utf-8");
  const { readme } = await generateReadmeForPackage(packageName);
  return currentReadme !== readme;
}

function fail() {
  const message = "Generated README files are missing or out of date. " + getFixCommand();
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function getFixCommand(): string {
  const arg = process.argv.find((a) => a.startsWith("--fix-command="));
  return arg?.split("=")[1] ?? "run the README generator";
}
