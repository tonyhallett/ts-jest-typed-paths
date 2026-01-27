import build from "./tsc-versioned-project-builder";

build("Cleaning release packages", undefined, ["tsconfig.release.json", "--clean"]);
build("Building release packages", undefined, ["tsconfig.release.json"]);
