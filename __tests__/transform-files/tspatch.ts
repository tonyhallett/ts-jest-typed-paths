import { transformToModuleName } from "ts-jest-typed-paths";
type ThingType = typeof import("../imported/exporting").thing;
const aFn = (path:string) => {};

aFn(transformToModuleName<ThingType>());