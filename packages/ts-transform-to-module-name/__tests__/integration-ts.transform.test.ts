import typescript from "typescript";
import { transformToModuleNameFactory } from "ts-transform-to-module-name";
import { transformerFactoryExpectedTransform } from "test-utils";

describe("testing with ts.transform", () => {
  it("should replace transformToModuleName with the module name of the type argument", () => {
    const source = `
      import { transformToModuleName } from "ts-transform-to-module-name";
      import { a } from "mod";
      
      function noop(arg: string) { }
      
      noop(transformToModuleName<typeof a>());
      `;
    const expectedTransformed = `
      import { transformToModuleName } from "ts-transform-to-module-name";
      import { a } from "mod";
      
      function noop(arg: string) { }
      
      noop("mod");
      `;

    const raiseDiagnostic = jest.fn();
    const transformerFactory = transformToModuleNameFactory(typescript, raiseDiagnostic);
    transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
    expect(raiseDiagnostic).not.toHaveBeenCalled();
  });

  it("should error when unsupported type argument is used", () => {
    const source = `
      import { transformToModuleName } from "ts-transform-to-module-name";
      
      function noop(arg: string) { }
      
      noop(transformToModuleName<boolean>());
      `;
    const raiseDiagnostic = jest.fn();
    const transformerFactory = transformToModuleNameFactory(typescript, raiseDiagnostic);
    const result = transformerFactoryExpectedTransform(source, source, transformerFactory);
    assertUnsupportedTypeArgument(raiseDiagnostic, result.sourceFile);
  });

  function assertUnsupportedTypeArgument(
    raiseDiagnostic: jest.Mock,
    sourceFile: typescript.SourceFile,
  ) {
    const unsupportedTypeArgumentDiagnosticCode = 10000;
    const expectedDiagnostic: Partial<typescript.Diagnostic> = {
      code: unsupportedTypeArgumentDiagnosticCode,
      messageText: "Unsupported usage of type argument for transformToModuleName",
      category: typescript.DiagnosticCategory.Error,
      file: sourceFile,
    };
    expect(raiseDiagnostic).toHaveBeenCalledWith(expect.objectContaining(expectedDiagnostic));
  }

  describe("AdditionalTransformFactory", () => {
    it("should be able to transform", () => {
      const transformerFactory = transformToModuleNameFactory(typescript, jest.fn(), ({ ts }) => {
        return (node) => {
          if (ts.isNumericLiteral(node)) {
            return ts.factory.createNumericLiteral("2");
          }
          return node;
        };
      });
      const source = `const a = 1;`;
      const expectedTransformed = `const a = 2;`;
      transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
    });

    it("should be able to remove a node by returning undefined", () => {
      const transformerFactory = transformToModuleNameFactory(typescript, jest.fn(), ({ ts }) => {
        return (node) => {
          if (ts.isDebuggerStatement(node)) {
            return undefined;
          }
          return node;
        };
      });
      const source = `const a = 1; 
        debugger;
        const b = 2;
        `;
      const expectedTransformed = `const a = 1; 
        const b = 2;
        `;
      transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
    });

    it("should be able to query for node info", () => {
      const isTransformToModuleNameResults: boolean[] = [];
      const moduleNamesFromTypeNode: (string | undefined)[] = [];
      const transformerFactory = transformToModuleNameFactory(
        typescript,
        jest.fn(),
        ({ sourceFile, ts }, getModuleNameFromTypeNode, isTransformToModuleName) => {
          return (node) => {
            if (
              ts.isCallExpression(node) &&
              node.expression.getText(sourceFile) === "genericFunction"
            ) {
              isTransformToModuleNameResults.push(isTransformToModuleName(node.arguments[0]));
              moduleNamesFromTypeNode.push(getModuleNameFromTypeNode(node.typeArguments![0], ""));
            }
            return node;
          };
        },
        "implementationModuleName",
      );
      const source = `import ttmn from "implementationModuleName";
          import { type Type } from "./otherModuleName";
          import { type Type2 } from "./otherModuleName2";
          const genericFunction = <T>(arg:string) => { };
          genericFunction<Type>("");
          genericFunction<Type2>(ttmn<Type>());
        `;
      const expectedTransformed = `import ttmn from "implementationModuleName";
          import { type Type } from "./otherModuleName";
          import { type Type2 } from "./otherModuleName2";
          const genericFunction = <T>(arg:string) => { };
          genericFunction<Type>("");
          genericFunction<Type2>("./otherModuleName");`;

      transformerFactoryExpectedTransform(source, expectedTransformed, transformerFactory);
      expect(isTransformToModuleNameResults).toEqual([false, true]);
      expect(moduleNamesFromTypeNode).toEqual(["./otherModuleName", "./otherModuleName2"]);
    });

    it("should be able to raise diagnostic, with the SourceFile", () => {
      const raiseDiagnostic = jest.fn();
      let raisedDiagnostic = false;
      const diagnostic: typescript.Diagnostic = {
        code: 10001,
        messageText: "Diagnostic from AdditionalTransformFactory",
        category: typescript.DiagnosticCategory.Warning,
        file: undefined,
        start: undefined,
        length: undefined,
      };
      const transformerFactory = transformToModuleNameFactory(
        typescript,
        raiseDiagnostic,
        ({ sourceFile }, __, ___, raiseDiagnosticArg) => {
          return (node) => {
            if (!raisedDiagnostic) {
              diagnostic.file = sourceFile;
              raiseDiagnosticArg(diagnostic);
              raisedDiagnostic = true;
            }
            return node;
          };
        },
      );
      const source = `const a = 1;`;
      transformerFactoryExpectedTransform(source, source, transformerFactory);

      expect(raiseDiagnostic).toHaveBeenCalledWith(diagnostic);
    });
  });
});
