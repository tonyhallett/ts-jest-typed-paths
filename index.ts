import { TsCompilerInstance, TTypeScript } from "ts-jest";
import {
  __String,
  Expression,
  ImportDeclaration,
  NodeArray,
  SourceFile,
  TransformationContext,
  TransformerFactory,
  TypeNode,
  Visitor,
} from "typescript";

export const name = "jest-typed-paths";
export const version = 1;
interface ImportInfo {
  moduleName: string;
  imports: string[];
}

const replaceQuotes = (input: string) =>
  input.replace("'", "").replace('"', "");

const transformToModuleNameModuleName =
  "ts-jest-typed-path/transformToModuleName";

class ImportsInfo {
  private imports: ImportInfo[] = [];
  add(importInfo: ImportInfo) {
    this.imports.push(importInfo);
  }
  transformToModuleNameName: string | undefined;

  getModuleName(x: string) {
    return this.imports.find((importInfo) => importInfo.imports.includes(x))
      ?.moduleName;
  }
}
interface TransformToModuleNameTypeInfoBase {
  start: number;
  length: number;
  supported: boolean;
}
interface UnsupportedTransformToModuleNameUsage
  extends TransformToModuleNameTypeInfoBase {
  supported: false;
}
interface TransformToModuleNameTypeInfo
  extends TransformToModuleNameTypeInfoBase {
  typeNameOrModuleName: string;
  isTypeName: boolean;
  supported: true;
}

function getTypeAliasModuleName(ts: TTypeScript, type: TypeNode) {
  if (
    ts.isImportTypeNode(type) &&
    ts.isLiteralTypeNode(type.argument) &&
    ts.isStringLiteral(type.argument.literal)
  ) {
    return replaceQuotes(type.argument.literal.text);
  }
}

function addImports(
  ts: TTypeScript,
  importDeclaration: ImportDeclaration,
  moduleName: string,
  importsInfo: ImportsInfo
) {
  if (importDeclaration.importClause?.namedBindings) {
    if (ts.isNamedImports(importDeclaration.importClause.namedBindings)) {
      const imports = importDeclaration.importClause.namedBindings.elements.map(
        (element) => {
          return element.name.getText();
        }
      );
      importsInfo.add({
        imports,
        moduleName,
      });
    }
    if (ts.isNamespaceImport(importDeclaration.importClause.namedBindings)) {
      importsInfo.add({
        imports: [importDeclaration.importClause.namedBindings.name.getText()],
        moduleName,
      });
    }
  }

  if (importDeclaration.importClause?.name) {
    importsInfo.add({
      imports: [importDeclaration.importClause.name.getText()],
      moduleName,
    });
  }
}

export const factory = (
  tsCompiler: TsCompilerInstance,
  opts?: Record<string, unknown>
) => {
  const configSet = tsCompiler.configSet;
  const ts = configSet.compilerModule;

  const getImportsInfo = (sourceFile: SourceFile): ImportsInfo => {
    return sourceFile.statements.reduce((importsInfo, statement) => {
      if (ts.isImportDeclaration(statement)) {
        const moduleSpecifier = statement.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const moduleName = moduleSpecifier.text;
          if (moduleName === transformToModuleNameModuleName) {
            const transformToModuleNameName =
              statement.importClause?.name?.getText();
            importsInfo.transformToModuleNameName = transformToModuleNameName;
          } else {
            addImports(ts, statement, moduleName, importsInfo);
          }
        }
      }
      if (ts.isTypeAliasDeclaration(statement)) {
        const moduleName = getTypeAliasModuleName(ts, statement.type);
        if (moduleName !== undefined) {
          importsInfo.add({
            imports: [statement.name.getText()],
            moduleName,
          });
        }
      }
      return importsInfo;
    }, new ImportsInfo());
  };

  const getTransformToModuleNameTypeArgument = (
    expression: Expression,
    transformToModuleNameName: string
  ) => {
    if (
      ts.isCallExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      expression.expression.getText() === transformToModuleNameName &&
      expression.typeArguments !== undefined &&
      expression.typeArguments.length === 1
    ) {
      return expression.typeArguments[0];
    }
  };

  const transform = (
    sourceFile: SourceFile,
    context: TransformationContext,
    importsInfo: ImportsInfo
  ) => {
    // the generic in transformToModuleName<T>
    function extractTransformToModuleNameTypeInfo(
      argumentExpressions: NodeArray<Expression>
    ):
      | TransformToModuleNameTypeInfo
      | UnsupportedTransformToModuleNameUsage
      | undefined {
      const expression = argumentExpressions[0];
      const typeArgument = getTransformToModuleNameTypeArgument(
        expression,
        importsInfo.transformToModuleNameName!
      );
      if (typeArgument) {
        const start = expression.getStart();
        const length = expression.getEnd() - start;
        if (ts.isTypeReferenceNode(typeArgument)) {
          return {
            typeNameOrModuleName: typeArgument.typeName.getText(),
            isTypeName: true,
            start,
            length,
            supported: true,
          };
        }
        if (ts.isTypeQueryNode(typeArgument)) {
          return {
            typeNameOrModuleName: typeArgument.exprName.getText(),
            isTypeName: true,
            start,
            length,
            supported: true,
          };
        }
        const moduleName = getTypeAliasModuleName(ts, typeArgument);
        if (moduleName !== undefined) {
          return {
            typeNameOrModuleName: moduleName,
            isTypeName: false,
            start,
            length,
            supported: true,
          };
        }
        return {
          start,
          length,
          supported: false,
        };
      }
    }

    function createVisitor(ctx: TransformationContext) {
      const visitor: Visitor = (node) => {
        if (ts.isCallExpression(node)) {
          const transformToModuleNameTypeInfo =
            extractTransformToModuleNameTypeInfo(node.arguments);

          const raiseDiagnostic = (
            transformToModuleNameTypeInfo: TransformToModuleNameTypeInfoBase
          ) => {
            configSet.raiseDiagnostics(
              [
                {
                  file: sourceFile,
                  category: ts.DiagnosticCategory.Error,
                  code: 0, // todo
                  messageText: "Unsupported usage of transformToModuleName",
                  start: transformToModuleNameTypeInfo.start,
                  length: transformToModuleNameTypeInfo.length,
                },
              ],
              sourceFile.fileName
            );
          };

          if (transformToModuleNameTypeInfo !== undefined) {
            if (!transformToModuleNameTypeInfo.supported) {
              // todo - different diagnostic
              raiseDiagnostic(transformToModuleNameTypeInfo);
            } else {
              let moduleName: string | undefined;
              if (transformToModuleNameTypeInfo.isTypeName) {
                moduleName = importsInfo.getModuleName(
                  transformToModuleNameTypeInfo.typeNameOrModuleName
                );
              } else {
                moduleName = transformToModuleNameTypeInfo.typeNameOrModuleName;
              }
              if (moduleName !== undefined) {
                node = ts.factory.updateCallExpression(
                  node,
                  node.expression,
                  node.typeArguments,
                  [
                    ts.factory.createStringLiteral(moduleName),
                    ...node.arguments.slice(1),
                  ]
                );
              } else {
                // todo - different diagnostic
                raiseDiagnostic(transformToModuleNameTypeInfo);
              }
            }
          }
        }
        if (ts.isImportDeclaration(node)) {
          const moduleSpecifier = node.moduleSpecifier;
          if (ts.isStringLiteral(moduleSpecifier)) {
            const moduleName = moduleSpecifier.text;
            if (moduleName === transformToModuleNameModuleName) {
              return undefined;
            }
          }
        }
        return ts.visitEachChild(node, visitor, ctx);
      };
      return visitor;
    }

    return ts.visitNode(sourceFile, createVisitor(context), (node) =>
      ts.isSourceFile(node)
    )!;
  };

  const transformerFactory: TransformerFactory<SourceFile> = (context) => {
    //tsCompiler.configSet.isTestFile

    return (sourceFile) => {
      const importsInfo = getImportsInfo(sourceFile);
      if (importsInfo.transformToModuleNameName !== undefined) {
        return transform(sourceFile, context, importsInfo);
      }
      return sourceFile;
    };
  };
  return transformerFactory;
};
