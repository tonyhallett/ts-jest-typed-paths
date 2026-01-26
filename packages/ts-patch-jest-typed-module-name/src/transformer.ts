import type { ProgramPattern } from "ts-patch";
import { createJestFactory } from "jest-typed-module-name";

const tsPatchFactory: ProgramPattern = (program, config, extras) => {
  const jestFactory = createJestFactory("ts-patch-jest-typed-module-name");
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return jestFactory(extras.ts as any, (diag: any) => extras.addDiagnostic(diag)) as any;
  /* eslint-enable @typescript-eslint/no-explicit-any */
};
export default tsPatchFactory;
