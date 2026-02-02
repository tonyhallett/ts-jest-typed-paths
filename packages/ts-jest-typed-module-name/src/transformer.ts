import type { AstTransformerDesc, TsCompilerInstance } from "ts-jest";
import { createJestFactory } from "jest-typed-module-name";

export const factory = (tsCompiler: TsCompilerInstance) => {
  // if needed the program can be accessed via tsCompiler.program
  const configSet = tsCompiler.configSet;
  const ts = configSet.compilerModule;
  const jestFactory = createJestFactory("ts-jest-typed-module-name");
  return jestFactory(ts, (diagnostic) => configSet.raiseDiagnostics([diagnostic]));
};
// currently not using the opts parameter of the factory function
const transformerDescription: AstTransformerDesc = {
  name: "jest-typed-module-name",
  version: 1,
  factory,
};
export const { name, version } = transformerDescription;
