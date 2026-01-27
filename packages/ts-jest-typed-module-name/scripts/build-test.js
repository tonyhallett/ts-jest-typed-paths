const build = require("../../../scripts/tsc-versioned-project-builder.js");
build("Building package ts-jest-typed-module-name and test dependencies", process.cwd(), [
  "tsconfig.refs.json",
]);
