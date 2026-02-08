import type { ProgramPattern } from "ts-patch";
import { createJestTransformerFactory } from "jest-typed-module-name";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for jsdoc
import type { TransformerFactory } from "typescript";

/**
  Factory function required by ts-patch to create the {@link TransformerFactory | `TransformerFactory<SourceFile>`}
  See [source transformers](https://github.com/nonara/ts-patch?tab=readme-ov-file#source-transformers)
  See [README](../Readme.md) for "Example Usage" and "Configuring ts-patch". 
 */
const tsPatchFactory: ProgramPattern = (program, config, { ts, addDiagnostic }) => {
  return createJestTransformerFactory(
    ts,
    (diag) => addDiagnostic(diag),
    "ts-patch-jest-typed-module-name",
  );
};
export default tsPatchFactory;
