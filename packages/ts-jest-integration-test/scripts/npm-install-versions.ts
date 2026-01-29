import * as fs from "fs";
import * as path from "node:path";
import { execSync } from "child_process";

export interface VersionPath {
  version: string;
  path: string;
}

function installVersions(versions: string[], dir: string, packageName: string): VersionPath[] {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  return versions.map((version) => {
    const versionDir = path.join(dir, `${packageName}-${version}`);
    const packagePath = path.join(versionDir, "node_modules", packageName);
    if (fs.existsSync(versionDir)) {
      console.log(`${packageName} ${version} already installed, skipping.`);
      return { version, path: packagePath };
    }
    console.log(`Installing ${packageName} ${version}...`);
    execSync(`npm install ${packageName}@${version} --prefix ${versionDir}`, {
      stdio: "inherit",
    });
    return { version, path: packagePath };
  });
}

export default installVersions;
