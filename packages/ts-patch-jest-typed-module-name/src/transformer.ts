import type { ProgramPattern } from "ts-patch";
import { createJestFactory } from "jest-typed-module-name";

const tsPatchFactory: ProgramPattern = (program, config, extras) => {
  const jestFactory = createJestFactory("ts-patch-jest-typed-module-name");
  return jestFactory(extras.ts, (diag) => extras.addDiagnostic(diag));
};
export default tsPatchFactory;
