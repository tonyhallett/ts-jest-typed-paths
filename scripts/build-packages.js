const { spawnSync } = require("child_process");
const installBuildTypescript = require("./build-base.js");

const { compilerPath, version } = installBuildTypescript();

console.log(`\n=== Building packages with TypeScript ${version} ===`);

// Run tsc build
const buildResult = spawnSync("node", [compilerPath, "-b", "--force", "tsconfig.build.json"], {
  stdio: "inherit",
  env: { ...process.env },
});

if (buildResult.status !== 0) {
  console.error(`Build failed for packages`);
  process.exit(buildResult.status ?? 1);
}

console.log(`Packages built successfully.`);
