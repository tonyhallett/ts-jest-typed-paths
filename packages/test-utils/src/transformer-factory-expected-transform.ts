import ts, { SourceFile, TransformerFactory } from "typescript";

interface TransformsToExpectedResult {
  diagnostics: ts.DiagnosticWithLocation[] | undefined;
  sourceFile: SourceFile;
}

function transformsToExpected(
  source: string,
  expectedTransformed: string,
  transformerFactory: TransformerFactory<SourceFile>,
): TransformsToExpectedResult {
  const sourceFile = createSourceFile(source);
  const result = ts.transform(sourceFile, [transformerFactory]);
  try {
    printsEqual(result.transformed[0], createSourceFile(expectedTransformed));
  } finally {
    result.dispose();
  }
  return {
    diagnostics: result.diagnostics,
    sourceFile,
  };
}

function createSourceFile(content: string) {
  return ts.createSourceFile("test.ts", content, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
}

function printsEqual(transformed: SourceFile, expected: SourceFile) {
  const printer = ts.createPrinter();
  const transformedText = printer.printFile(transformed);
  const expectedTransformedText = printer.printFile(expected);
  if (transformedText !== expectedTransformedText) {
    throw new Error(
      "Transformed text does not match expected.\nTransformed:\n" +
        transformedText +
        "\nExpected:\n" +
        expectedTransformedText,
    );
  }
}

export default transformsToExpected;
