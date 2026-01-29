import { getMinimumTypeScriptVersion } from "test-utils";
import { executeJestForTsVersionRange } from "./jest-ts-versions-compiler-path-env-tester";

runTestForMinimumPeerDependencyVersion();

function runTestForMinimumPeerDependencyVersion() {
  const minVersion = getMinimumTypeScriptVersion("ts-jest-typed-module-name");
  const results = executeJestForTsVersionRange(minVersion, {
    jestArgs: "--no-cache",
  });
  if (results.length !== 1 || !results[0].success) {
    console.log(`Tests failed for minimum TypeScript peer dependency version ${minVersion}`);
    process.exitCode = 1;
  } else {
    console.log(`Tests passed for minimum TypeScript peer dependency version ${minVersion}`);
  }
}
