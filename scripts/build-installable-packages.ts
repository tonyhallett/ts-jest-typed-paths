import build from "./tsc-versioned-project-builder";

build("Cleaning installable packages", undefined, ["tsconfig.installables.json", "--clean"]);
build("Building installable packages", undefined, ["tsconfig.installables.json"]);
