const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const installBuildTypescript = require("./build-base.js");

// Determine the package invoking this script
const pkgDir = process.cwd();
const pkgJsonPath = path.join(pkgDir, "package.json");

if (!fs.existsSync(pkgJsonPath)) {
  console.error("No package.json found in current directory:", pkgDir);
  process.exit(1);
}

const { compilerPath, version } = installBuildTypescript();

const pkgName = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8")).name || pkgDir;
console.log(`\n=== Building package ${pkgName} with TypeScript ${version} ===`);

// Run tsc build
const buildResult = spawnSync("node", [compilerPath, "-b", "--force"], {
  stdio: "inherit",
  cwd: pkgDir,
  env: { ...process.env },
});

if (buildResult.status !== 0) {
  console.error(`Build failed for package ${pkgName}`);
  process.exit(buildResult.status ?? 1);
}

console.log(`Package ${pkgName} built successfully.`);
