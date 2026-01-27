const installBuildTypescript = require("./install-build-typescript");
const { spawnSync } = require("child_process");

function build(buildReason, cwd, additionalArgs) {
  const { compilerPath, version } = installBuildTypescript();
  tsVersionedProjectBuildAndLog(buildReason, compilerPath, version, cwd, additionalArgs);
}
module.exports = build;

function tsVersionedProjectBuildAndLog(buildReason, tscPath, tsVersion, cwd, additionalArgs) {
  log(`${buildReason} with TypeScript ${tsVersion}`);
  const buildResult = tsVersionedProjectBuild(tscPath, cwd, additionalArgs);
  if (buildResult.status !== 0) {
    log("Build failed", true);
    console.error(`Build failed for package ${packageName}`);
    process.exit(buildResult.status ?? 1);
  }

  log("Build succeeded");
}

function tsVersionedProjectBuild(tscPath, cwd, additionalArgs) {
  const args = [tscPath, "-b", ...(additionalArgs ?? [])];

  return spawnSync("node", args, {
    stdio: "inherit",
    cwd,
    env: { ...process.env },
  });
}

function log(message, isError = false) {
  const logFunction = isError ? console.error : console.log;
  logFunction(`=== ${message} ===`);
}
