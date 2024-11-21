import { TTypeScript } from "ts-jest";
import { ImportDeclaration, SourceFile } from "typescript";
import { getTypeAliasModuleName } from "./helpers";
import { transformToPath } from ".";
import { packageName } from "./package-name";

const transformToPathFunctionName = transformToPath.name;

export interface ImportInfo {
  moduleName: string;
  imports: string[];
}

export class ImportsInfo {
  private imports: ImportInfo[] = [];
  add(importInfo: ImportInfo) {
    this.imports.push(importInfo);
  }
  transformToPathName: string | undefined;

  getModuleName(x: string) {
    return this.imports.find((importInfo) => importInfo.imports.includes(x))
      ?.moduleName;
  }
}

function getImports(
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

const getTransformToPathFunctionName = (
  ts: TTypeScript,
  statement: ImportDeclaration
) => {
  const namedBindings = statement.importClause?.namedBindings;
  if (namedBindings && ts.isNamedImports(namedBindings)) {
    const importSpecifier = namedBindings.elements.find((element) => {
      const compare = element.propertyName ?? element.name;
      return compare.text === transformToPathFunctionName;
    });
    if (importSpecifier) {
      return importSpecifier.name.text;
    }
  }
};

export const getImportsInfo = (
  ts: TTypeScript,
  sourceFile: SourceFile
): ImportsInfo => {
  return sourceFile.statements.reduce((importsInfo, statement) => {
    if (ts.isImportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const moduleName = moduleSpecifier.text;
        if (moduleName === packageName) {
          const transformToPathName = getTransformToPathFunctionName(
            ts,
            statement
          );
          if (transformToPathName) {
            importsInfo.transformToPathName = transformToPathName;
          }
        } else {
          getImports(ts, statement, moduleName, importsInfo);
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
