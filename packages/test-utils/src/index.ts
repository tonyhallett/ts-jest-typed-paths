import fs from "fs";
import os from "os";
import path from "path";
import { mkdtempSync } from "fs";
import { spawnSync } from "child_process";

export interface TempDependentProject {
  testDirectory: string;
  createFile: (contents: string, fileName: string) => string;
  cleanUp: () => void;
  npmInstall: (arg?: string) => void;
}

export function createTempDependentProject(
  additionalPackageJson: Record<string, any>,
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
