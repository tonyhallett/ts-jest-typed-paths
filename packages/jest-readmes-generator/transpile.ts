import * as ts from "typescript";
import * as fs from "fs";
import { factory } from "../ts-jest-typed-module-name/src/transformer";

const compilerInstance = {
  configSet: {
    compilerModule: ts,
  },
} as unknown as Parameters<typeof factory>[0];
const tsTransformer: ts.TransformerFactory<ts.SourceFile> = factory(
  compilerInstance,
) as unknown as ts.TransformerFactory<ts.SourceFile>;

function transpileTest(testPath: string) {
  const content = fs.readFileSync(testPath, "utf8");

  const result = ts.transpileModule(content, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      // Important: preserve TS syntax if you want TS output
      newLine: ts.NewLineKind.LineFeed,
    },
    transformers: {
      before: [tsTransformer],
    },
  });
  return result.outputText;
}

export default transpileTest;
