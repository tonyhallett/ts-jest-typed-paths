import type { ProgramPattern } from "ts-patch";
import { createJestFactory } from "jest-transform-to-path";

const tsPatchFactory: ProgramPattern = (program, config, extras) => {
  const jestFactory = createJestFactory();
  return jestFactory(extras.ts, (diag) => extras.addDiagnostic(diag));
};
export default tsPatchFactory;
