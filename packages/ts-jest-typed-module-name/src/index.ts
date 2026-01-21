import type { TsCompilerInstance } from "ts-jest";
import { createJestFactory } from "jest-transform-to-path";

export const name = "jest-typed-module-name";
export const version = 1;

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
