const build = require("./tsc-versioned-project-builder.js");

build("Building all packages", undefined, ["--force", "tsconfig.build.json"]);
