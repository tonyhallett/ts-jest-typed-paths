import * as fs from "fs";
import * as path from "path";
import build from "./tsc-versioned-project-builder";

const shouldBePkgDir = process.cwd();
const pkgName = getPackageName(shouldBePkgDir);

build(`Building package ${pkgName}`, shouldBePkgDir);

function getPackageName(dir: string): string {
  const pkgJsonPath = path.join(dir, "package.json");

  if (!fs.existsSync(pkgJsonPath)) {
    console.error("No package.json found in current directory:", dir);
    process.exit(1);
  }
  const packageName = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8")).name;
  if (packageName === undefined) {
    console.error("No package.json found in current directory:", dir);
    process.exit(1);
  }
  return packageName;
}
