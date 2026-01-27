const build = require("./tsc-versioned-project-builder.js");

build("Cleaning installable packages", undefined, ["tsconfig.installables.json", "--clean"]);
build("Building installable packages", undefined, ["tsconfig.installables.json"]);
