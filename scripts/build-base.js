const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

// -----------------------------
// 2. Configuration: constant TypeScript version
// -----------------------------
const TS_VERSION = "5.6.3"; // change as needed
const TS_BUILD_DIR = path.resolve(__dirname, "..", "typescript-build");
const TS_COMPILER_PATH = path.join(TS_BUILD_DIR, "node_modules", "typescript", "lib", "tsc.js");

function installBuildTypescript() {
  // -----------------------------
  // 2. Install TypeScript if missing
  // -----------------------------
  if (!fs.existsSync(TS_COMPILER_PATH)) {
    console.log(`TypeScript ${TS_VERSION} not found. Installing...`);
    const installResult = spawnSync(
      "npm",
      ["install", `typescript@${TS_VERSION}`, "--prefix", TS_BUILD_DIR],
      { stdio: "inherit", shell: true },
    );

    if (installResult.status !== 0) {
      console.error("Failed to install TypeScript. Exiting.");
      process.exit(1);
    }
  }

  return { compilerPath: TS_COMPILER_PATH, version: TS_VERSION };
}

module.exports = installBuildTypescript;
