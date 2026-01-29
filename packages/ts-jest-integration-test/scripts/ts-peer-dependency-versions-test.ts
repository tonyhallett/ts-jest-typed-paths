import * as fs from "fs";
import * as path from "path";
import * as semver from "semver";
import { executeJestForTsVersionRange } from "./jest-ts-versions-compiler-path-env-tester";

runPeerDependencyJestTests();

export function runPeerDependencyJestTests() {
  const tsSemverRange = getTsPeerDependencyVersion();
  const tsVersionsDir = path.join(__dirname, "..", "ts-versions");
  const results = executeJestForTsVersionRange(tsSemverRange, tsVersionsDir, {
    jestArgs: "--no-cache",
  });
  if (results.every((r) => r.success)) {
    console.log("\n\nAll tests passed for all applicable TypeScript versions.");
  } else {
    console.log("\n\nSome tests failed:");
    results.forEach((r) => {
      if (!r.success) {
        console.log(`- TypeScript version ${r.version} failed`);
      }
    });
    process.exitCode = 1;
  }
}

function getNonPrivatePackageJsons() {
  const packagesDirectory = path.join(__dirname, "..", "..", "..", "packages");

  const packages = fs.readdirSync(packagesDirectory);
  return packages
    .map((pkg) => {
      const pkgJsonPath = path.join(packagesDirectory, pkg, "package.json");
      // read
      if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
        if (pkgJson.private === true) {
          return undefined;
        }
        return pkgJson;
      }
      return undefined;
    })
    .filter((p) => p !== undefined);
}

function getTsPeerDependencyVersion(): string {
  let tsSemver: string | undefined = undefined;
  for (const pkgJson of getNonPrivatePackageJsons()) {
    const typescriptVersion = pkgJson.peerDependencies?.typescript;
    if (typescriptVersion === undefined) {
      throw new Error(`Package ${pkgJson.name} does not have typescript as peerDependency`);
    }
    if (semver.valid(typescriptVersion) || semver.validRange(typescriptVersion)) {
      if (tsSemver === undefined) {
        tsSemver = typescriptVersion;
      } else {
        if (!versionsEqual(tsSemver, typescriptVersion)) {
          throw new Error(
            `Mismatch TypeScript versions found in peerDependencies: ${tsSemver} and ${typescriptVersion}`,
          );
        }
      }
    } else {
      throw new Error(
        `Package ${pkgJson.name} has invalid typescript version as peerDependency: ${typescriptVersion}`,
      );
    }
  }
  if (tsSemver === undefined) {
    throw new Error("No TypeScript peerDependency version found");
  }
  return tsSemver;

  function versionsEqual(version1: string, version2: string): boolean {
    const normalize = (v: string) => v.replace(/\s+/g, " ").trim();
    return normalize(version1) === normalize(version2);
  }
}
