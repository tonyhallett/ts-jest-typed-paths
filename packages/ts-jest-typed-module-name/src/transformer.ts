import type { AstTransformerDesc, TsCompilerInstance } from "ts-jest";
import { createJestFactory } from "jest-transform-to-path";

// currently not using the opts parameter of the factory function
const transformerDescription: AstTransformerDesc = {
  name: "jest-typed-module-name",
  version: 1,
  factory(tsCompiler: TsCompilerInstance) {
    const configSet = tsCompiler.configSet;
    const ts = configSet.compilerModule;
    const jestFactory = createJestFactory("ts-jest-typed-module-name");
    return jestFactory(ts, (diagnostic) => configSet.raiseDiagnostics([diagnostic]));
  },
};
export const { name, version, factory } = transformerDescription;
