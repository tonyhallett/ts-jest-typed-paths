import { ImportDeclaration, SourceFile } from "typescript";
import getTypeAliasModuleName from "./getTypeAliasModuleName";
import { packageName } from "./package-name";
import { getTransformToModuleNameName } from "./transformToModuleName-ast";
import { TTypeScript } from "./ts";

export interface ImportInfo {
  moduleName: string;
  imports: string[];
}

export class ImportsInfo {
  private imports: ImportInfo[] = [];
  add(importInfo: ImportInfo) {
    this.imports.push(importInfo);
  }
  transformToModuleNameName: string | undefined;

  getModuleName($import: string) {
    return this.imports.find((importInfo) => importInfo.imports.includes($import))?.moduleName;
  }
}

function addImportsFromImportDeclaration(
  ts: TTypeScript,
  importDeclaration: ImportDeclaration,
  moduleName: string,
  importsInfo: ImportsInfo,
) {
  const namedBindings = importDeclaration.importClause?.namedBindings;
  if (namedBindings) {
    if (ts.isNamedImports(namedBindings)) {
      const imports = namedBindings.elements.map((element) => {
        return element.name.getText();
      });
      importsInfo.add({
        imports,
        moduleName,
      });
    } else {
      const namespaceImport = namedBindings;
      importsInfo.add({
        imports: [namespaceImport.name.getText()],
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

type ModuleNameIfExportsTransformToModuleName = string | undefined;

function moduleExportsTransformToModuleName(
  moduleName: string,
  moduleNameIfExportsTransformToModuleName: ModuleNameIfExportsTransformToModuleName,
): boolean {
  return moduleName === packageName || moduleName === moduleNameIfExportsTransformToModuleName;
}

export const getImportsInfo = (
  ts: TTypeScript,
  sourceFile: SourceFile,
  moduleNameIfExportsTransformToModuleName: ModuleNameIfExportsTransformToModuleName,
): ImportsInfo => {
  return sourceFile.statements.reduce((importsInfo, statement) => {
    if (ts.isImportDeclaration(statement)) {
      const moduleSpecifier = statement.moduleSpecifier;
      // /** If this is not a StringLiteral it will be a grammar error. */
      if (ts.isStringLiteral(moduleSpecifier)) {
        const moduleName = moduleSpecifier.text;
        if (
          moduleExportsTransformToModuleName(moduleName, moduleNameIfExportsTransformToModuleName)
        ) {
          importsInfo.transformToModuleNameName = getTransformToModuleNameName(ts, statement);
        } else {
          addImportsFromImportDeclaration(ts, statement, moduleName, importsInfo);
        }
      }
    } else if (ts.isTypeAliasDeclaration(statement)) {
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
