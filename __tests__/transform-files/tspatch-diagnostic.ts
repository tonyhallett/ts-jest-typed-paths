import { transformToPath } from "ts-jest-typed-paths";
const aFn = (path:string) => {};

aFn(transformToPath<string>());