import ts, { SourceFile, TransformerFactory } from "typescript";

function transformsToExpected(
  source: string,
  expectedTransformed: string,
  transformerFactory: TransformerFactory<SourceFile>,
): boolean {
  const result = ts.transform(createSourceFile(source), [transformerFactory]);
  return printsEqual(result.transformed[0], createSourceFile(expectedTransformed));
}

function createSourceFile(content: string) {
  return ts.createSourceFile("test.ts", content, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
}

function printsEqual(transformed: SourceFile, expected: SourceFile) {
  const printer = ts.createPrinter();
  const transformedText = printer.printFile(transformed);
  const expectedTransformedText = printer.printFile(expected);
  return transformedText === expectedTransformedText;
}

export default transformsToExpected;
