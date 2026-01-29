import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { mkdtempSync } from "fs";
import { spawnSync } from "child_process";
import installVersions from "./npm-install-versions";
import * as semver from "semver";

export interface TempDependentProject {
  testDirectory: string;
  createFile: (contents: string, fileName: string) => string;
  cleanUp: () => void;
  npmInstall: (arg?: string) => void;
}

export function createTempDependentProject(
  additionalPackageJson: Record<string, unknown>,
): TempDependentProject {
  const testDirectory = mkdtempSync(path.join(os.tmpdir(), "typedpathstest-"));
  createPackageJson();
  createExportingFile();
  npmInstall();

  function createPackageJson() {
    const packageJsonContent = {
      name: "tmp-proj",
      version: "1.0.0",
      ...additionalPackageJson,
    };
    createFile(JSON.stringify(packageJsonContent, null, 2), "package.json");
  }

  function createExportingFile() {
    const code = `
interface Thing{}
export const thing: Thing = {};
export class AClass {}
export type ExportedType = {};
export default class ExportDefault {};
`;
    createFile(code, "exporting.ts");
  }

  function npmInstall(arg?: string) {
    const args = ["i"];
    if (arg) {
      args.push(arg);
    }
    const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
    const install = spawnSync(npmCmd, args, {
      cwd: testDirectory,
      encoding: "utf8",
      shell: process.platform === "win32",
    });
    if (install.error) {
      throw install.error;
    }
    expect(install.status).toBe(0);
  }

  function createFile(contents: string, fileName: string) {
    const filePath = path.join(testDirectory, fileName);
    fs.writeFileSync(filePath, contents);
    return filePath;
  }

  function cleanUp() {
    fs.rmSync(testDirectory, { recursive: true, force: true });
  }

  return {
    testDirectory,
    createFile,
    cleanUp,
    npmInstall,
  };
}

export function installTypescriptVersions(versions: string[]) {
  const tsVersionsDir = path.join(__dirname, "..", "ts-versions");
  return installVersions(versions, tsVersionsDir, "typescript");
}

function readTypescriptPeerDependency(packageName: string) {
  const pkgJsonPath = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "packages",
    packageName,
    "package.json",
  );
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
  return pkgJson.peerDependencies.typescript as string;
}

export function getMinimumTypeScriptVersion(packageName: string) {
  const typescriptVersion = readTypescriptPeerDependency(packageName);
  const minVersion = semver.minVersion(typescriptVersion)!;
  return minVersion.version;
}
