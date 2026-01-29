import { execSync } from "node:child_process";
import * as semver from "semver";

export function getVersionsFromNpm(packageName: string) {
  const result = execSync(`npm view ${packageName} versions --json`, {
    encoding: "utf-8",
  });
  return JSON.parse(result) as string[];
}

export function getSortedValidNonPreReleaseVersions(packageName: string) {
  const allVersions = getVersionsFromNpm(packageName);
  return allVersions
    .filter((v) => {
      const valid = semver.valid(v); // null for totally invalid strings
      if (!valid) return false;

      return !semver.prerelease(v); // array if pre-release, null if stable
    })
    .sort((a, b) => semver.compare(a, b)!);
}
