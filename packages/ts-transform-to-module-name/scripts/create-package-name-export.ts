import * as fs from "fs";
import * as path from "path";

const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const moduleName = packageJson.name;

const packageNameSrcPath = path.resolve(__dirname, "../src/package-name.ts");
// I want this to have a new line at the end of the file
const packageNameSrc = `export const packageName = "${moduleName}";\n`;
fs.writeFileSync(packageNameSrcPath, packageNameSrc);
