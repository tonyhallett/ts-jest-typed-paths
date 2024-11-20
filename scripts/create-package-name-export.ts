import * as fs from "fs";
import * as path from "path";

const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const moduleName = packageJson.name;

const packageNameSrcPath = path.resolve(__dirname, "../src/package-name.ts");
const packageNameSrc = `export const packageName = "${moduleName}";`;
fs.writeFileSync(packageNameSrcPath, packageNameSrc);
