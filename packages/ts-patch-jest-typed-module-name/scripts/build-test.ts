import build from "../../../scripts/tsc-versioned-project-builder";

build("Building package ts-patch-jest-typed-module-name and test dependencies", process.cwd(), [
  "tsconfig.refs.json",
]);
