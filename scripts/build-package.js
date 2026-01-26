const fs = require("fs");
const path = require("path");
const build = require("./tsc-versioned-project-builder.js");

const shouldBePkgDir = process.cwd();
const pkgName = getPackageName(shouldBePkgDir);

build(`Building package ${pkgName}`, shouldBePkgDir);

function getPackageName(dir) {
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
