import type { AstTransformerDesc } from "ts-jest";
import { createJestFactory } from "jest-typed-module-name";

// currently not using the opts parameter of the factory function
const transformerDescription: AstTransformerDesc = {
  name: "jest-typed-module-name",
  version: 1,
  factory(tsCompiler) {
    const configSet = tsCompiler.configSet;
    const ts = configSet.compilerModule;
    const jestFactory = createJestFactory("ts-jest-typed-module-name");
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return jestFactory(ts as any, (diagnostic: any) =>
      configSet.raiseDiagnostics([diagnostic]),
    ) as any;
    /* eslint-enable @typescript-eslint/no-explicit-any */
  },
};
export const { name, version, factory } = transformerDescription;
