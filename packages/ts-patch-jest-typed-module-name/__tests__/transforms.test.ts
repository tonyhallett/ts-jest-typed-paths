import * as fs from "fs";
import * as path from "path";
import { PluginConfig } from "ts-patch";
import { unsupportedTypeArgumentDiagnosticCode } from "../../transform-to-path/src/diagnostics";
import { spawnSync } from "child_process";
import { packageName as transformToPathPackageName } from "../../transform-to-path/src/package-name";
import { createTempDependentProject, TempDependentProject } from "test-utils";
import createTarballs from "./createTarballs";

describe("transformer", () => {
  let tempDependentProject: TempDependentProject;
  let tarballDir: string;
  const packagesInstallOrder = [
    "transform-to-path",
    "jest-transform-to-path",
    "ts-patch-jest-typed-module-name",
  ];
  beforeAll(() => {
    tarballDir = createTarballs(packagesInstallOrder);
  });

  beforeEach(() => {
    const packageJsonContent = {
      scripts: {
        tspatch: "tspc",
      },
      devDependencies: {
        "ts-patch": "^3.2.1",
        typescript: "^5.6.3",
      },
    };
    tempDependentProject = createTempDependentProject(packageJsonContent);
    installTarballs();
  });

  afterEach(() => {
    tempDependentProject.cleanUp();
  });

  afterAll(() => {
    fs.rmSync(tarballDir, { recursive: true });
  });

  function installTarballs() {
    const files = fs.readdirSync(tarballDir);
    for (const pkg of packagesInstallOrder) {
      const tarballFileName = files.find(
        (file) => file.startsWith(pkg) && file.endsWith(".tgz"),
      );
      if (!tarballFileName) {
        throw new Error(
          `Could not find tarball for package ${pkg} in ${tarballDir}`,
        );
      }
      const tarballPath = path.join(tarballDir, tarballFileName);
      tempDependentProject.npmInstall(tarballPath);
    }
  }

  describe("ts-patch", () => {
    it("should work", () => {
      const code = `import { transformToPath } from "${transformToPathPackageName}";
		const aFn = (path:string) => {};
aFn(transformToPath<typeof import("./exporting")>());`;
      const { transpiled } = tsPatchTest(code);

      expect(transpiled).toContain('aFn("./exporting");');
    });

    it("should have diagnostic", () => {
      const errorCode = `import { transformToPath } from "${transformToPathPackageName}";
      const aFn = (path:string) => {};
      
      aFn(transformToPath<string>());`;

      const { processOut } = tsPatchTest(errorCode);

      expect(processOut).toContain(
        `(4,27): error TS${unsupportedTypeArgumentDiagnosticCode}: Unsupported usage of type argument for transformToPath`,
      );
    });

    function tsPatchTest(code: string): {
      transpiled: string;
      processOut: string;
    } {
      const toTransformPath = tempDependentProject.createFile(
        code,
        "toTransform.ts",
      );
      const tsConfigPath = writeTsConfig();

      const command = `npm run tspatch -- --project ${tsConfigPath}`;
      const buffer = spawnSync(command, {
        shell: true,
        cwd: tempDependentProject.testDirectory,
        encoding: "utf-8",
      });
      const processOut = buffer.stdout.toString();

      const transpiledPath = path.join(
        tempDependentProject.testDirectory,
        "tspatchout",
        "toTransform.js",
      );
      const transpiled = fs.readFileSync(transpiledPath, "utf-8");
      return { transpiled, processOut };

      function writeTsConfig() {
        const tsPatchPlugin: PluginConfig = {
          transform: "ts-patch-jest-typed-module-name/transformer",
        };
        const tsPatchTsConfig = {
          compilerOptions: {
            outDir: "./tspatchout",
            plugins: [tsPatchPlugin],
            target: "ES2019",
            lib: ["ES2019"],
            esModuleInterop: true,
            moduleResolution: "node",
          },
          include: [toTransformPath],
        };
        return tempDependentProject.createFile(
          JSON.stringify(tsPatchTsConfig),
          "tsconfig.tspatch.json",
        );
      }
    }
  });
});
