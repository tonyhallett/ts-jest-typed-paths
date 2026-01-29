import { execSync } from "child_process";
import { getMinimumTypeScriptVersion, installTypescriptVersions } from "test-utils";

runTestForMinimumPeerDependencyVersion();

function runTestForMinimumPeerDependencyVersion() {
  const minVersion = getMinimumTypeScriptVersion("ts-patch-jest-typed-module-name");
  const typescriptPath = installTypescriptVersions([minVersion])[0].path;

  execSync(`npx tspc --project tsconfig.json`, {
    stdio: "inherit",
    env: {
      ...process.env,
      TSP_COMPILER_TS_PATH: typescriptPath,
    },
  });
}
