import { TsCompilerInstance } from "ts-jest";
import { ProgramPattern } from "ts-patch";
import { createJestFactory } from "./jestFactory";
import { transformToPathFactory } from "./transformToPathFactory";
import { transformToPath } from "./transformToPath";

export const name = "jest-typed-paths";
export const version = 7;

// ts -jest
export const factory = (
  tsCompiler: TsCompilerInstance,
  opts?: Record<string, unknown>,
) => {
  const configSet = tsCompiler.configSet;
  const ts = configSet.compilerModule;
  const jestFactory = createJestFactory();
  return jestFactory(ts, (diagnostic) =>
    configSet.raiseDiagnostics([diagnostic]),
  );
};

// ts-patch
export const tsPatchFactory: ProgramPattern = (program, config, extras) => {
  const jestFactory = createJestFactory();
  return jestFactory(extras.ts, (diag) => extras.addDiagnostic(diag));
};

export { transformToPath, transformToPathFactory };
