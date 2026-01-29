import * as semver from "semver";
import { execSync } from "child_process";
import { getSortedValidNonPreReleaseVersions } from "./npm-versions";
import installVersions from "./npm-install-versions";

export function executeJestForTsVersionRange(
  tsSemverRange: string,
  tsVersionsInstallDir: string,
  jestExecutionArgs?: JestCompilerPathEnvExecutionArgs,
) {
  return executeJestForTsVersions(
    installVersions(getVersionsInRange(tsSemverRange), tsVersionsInstallDir, "typescript"),
    jestExecutionArgs,
  );
}

function getVersionsInRange(tsVersionRange: string) {
  const allVersions = getSortedValidNonPreReleaseVersions("typescript");
  return allVersions.filter((v) => semver.satisfies(v, tsVersionRange));
}

export interface JestVersionResult {
  version: string;
  success: boolean;
}

export interface TypescriptVersion {
  version: string;
  path: string;
}

export interface JestCompilerPathEnvExecutionArgs {
  jestArgs?: string;
  tsCompilerPathEnvVarName?: string;
  logger?: (version: TypescriptVersion, jestArgs: string, tsCompilerPathEnvVarName: string) => void;
}

export function executeJestForTsVersions(
  typescriptVersions: TypescriptVersion[],
  jestExecutionArgs?: JestCompilerPathEnvExecutionArgs,
): JestVersionResult[] {
  const tsCompilerPathEnvVarName =
    jestExecutionArgs?.tsCompilerPathEnvVarName || "TS_COMPILER_PATH";
  const log =
    jestExecutionArgs?.logger ||
    ((version, jestArgs) => {
      if (jestExecutionArgs?.logger !== null) {
        console.log(
          `Running jest with typescript version ${version.version} and args: ${jestArgs}`,
        );
      }
    });

  return typescriptVersions.map((version) => {
    const jestArgs = jestExecutionArgs?.jestArgs || "";
    log(version, jestArgs, tsCompilerPathEnvVarName);
    let success = true;
    try {
      execSync(`jest ${jestArgs}`, {
        stdio: "inherit",
        env: {
          ...process.env,
          [tsCompilerPathEnvVarName]: version.path,
        },
      });
    } catch {
      success = false;
    }
    const result: JestVersionResult = {
      version: version.version,
      success,
    };
    return result;
  });
}
