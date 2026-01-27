import installBuildTypescript from "./install-build-typescript";
import { spawnSync } from "child_process";

function build(buildReason: string, cwd?: string, additionalArgs?: string[]) {
  const { compilerPath, version } = installBuildTypescript();
  tsVersionedProjectBuildAndLog(buildReason, compilerPath, version, cwd, additionalArgs);
}
export default build;

function tsVersionedProjectBuildAndLog(
  buildReason: string,
  tscPath: string,
  tsVersion: string,
  cwd: string | undefined,
  additionalArgs: string[] | undefined,
) {
  log(`${buildReason} with TypeScript ${tsVersion}`);
  const buildResult = tsVersionedProjectBuild(tscPath, cwd, additionalArgs);
  if (buildResult.status !== 0) {
    log("Build failed", true);
    process.exit(buildResult.status ?? 1);
  }

  log("Build succeeded");
}

function tsVersionedProjectBuild(
  tscPath: string,
  cwd: string | undefined,
  additionalArgs: string[] | undefined,
) {
  const args = [tscPath, "-b", ...(additionalArgs ?? [])];

  return spawnSync("node", args, {
    stdio: "inherit",
    cwd,
    env: { ...process.env },
  });
}

function log(message: string, isError = false) {
  const logFunction = isError ? console.error : console.log;
  logFunction(`=== ${message} ===`);
}
