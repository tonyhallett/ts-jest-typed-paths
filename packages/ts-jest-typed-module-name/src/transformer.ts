import type { AstTransformerDesc, TsCompilerInstance } from "ts-jest";
import { createJestTransformerFactory } from "jest-typed-module-name";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for jsdoc
import type { TransformerFactory } from "typescript";

// currently not using the opts parameter of the factory function
/**
  Factory function required by ts-jest to create the {@link TransformerFactory}
  see https://kulshekhar.github.io/ts-jest/docs/getting-started/options/astTransformers
  See [README](../Readme.md) for "Example Usage" and "Adding the transfomer to ts-jest"
 */
export const factory = (tsCompiler: TsCompilerInstance) => {
  // if needed the program can be accessed via tsCompiler.program
  const configSet = tsCompiler.configSet;
  const ts = configSet.compilerModule;
  return createJestTransformerFactory(
    ts,
    (diagnostic) => configSet.raiseDiagnostics([diagnostic]),
    "ts-jest-typed-module-name",
  );
};

const transformerDescription: AstTransformerDesc = {
  name: "jest-typed-module-name",
  version: 1,
  factory,
};

export const { name, version } = transformerDescription;
