import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import semver from "semver";

const tsVersionsDir = path.join(__dirname, "..", "ts-versions");

const typescriptVersions = getVersionsFromNpm();
installTypescriptVersions(typescriptVersions, tsVersionsDir);
runJestForEveryTsVersions(typescriptVersions, tsVersionsDir);

function runJestForEveryTsVersions(
  typescriptVersions: string[],
  typeScriptVersionDirectory: string,
) {
  typescriptVersions.forEach((version) => {
    const pathToTs = path.join(
      typeScriptVersionDirectory,
      `typescript-${version}`,
      "node_modules",
      "typescript",
    );

    run("jest", {
      TS_COMPILER_PATH: pathToTs,
    });
  });
}

function getVersionsFromNpm() {
  const result = execSync("npm view typescript versions --json", {
    encoding: "utf-8",
  });
  const allVersions = JSON.parse(result) as string[];
  return allVersions
    .filter((v) => {
      const valid = semver.valid(v); // null for totally invalid strings
      if (!valid) return false;

      const pre = semver.prerelease(v); // array if pre-release, null if stable
      if (pre) return false; // skip pre-release

      return semver.major(v)! >= 5; // only major >= 5
    })
    .sort((a, b) => semver.compare(a, b)!);
}

function installTypescriptVersions(versions: string[], dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  for (const version of versions) {
    const versionDir = path.join(dir, `typescript-${version}`);
    if (fs.existsSync(versionDir)) {
      console.log(`TypeScript ${version} already installed, skipping.`);
      continue;
    }
    run(`npm install typescript@${version} --prefix ${versionDir}`);
  }
}

function run(cmd: string, env?: NodeJS.ProcessEnv) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...env,
    },
  });
}
