import * as ts from "typescript";
import * as fs from "fs";
import { createJestFactory } from "jest-typed-module-name";

function tranformTest(testPath: string, moduleName: string) {
  const content = fs.readFileSync(testPath, "utf8");
  const sourceFile = ts.createSourceFile(
    "test.ts",
    content,
    ts.ScriptTarget.ES2015,
    true,
    ts.ScriptKind.TS,
  );
  const transformerFactory = createJestFactory(moduleName)(ts, (diag) => console.error(diag));
  const result = ts.transform(sourceFile, [transformerFactory]);
  const printer = ts.createPrinter();
  return printer.printFile(result.transformed[0]);
}

export default tranformTest;
