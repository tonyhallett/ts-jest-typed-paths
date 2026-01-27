const build = require("../../../scripts/tsc-versioned-project-builder.js");
build("Building package ts-patch-jest-typed-module-name and test dependencies", process.cwd(), [
  "tsconfig.refs.json",
]);
