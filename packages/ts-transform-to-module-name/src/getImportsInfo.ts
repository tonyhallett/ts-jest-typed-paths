import { ImportDeclaration, SourceFile } from "typescript";
import tryGetImportTypeNodeModuleName from "./tryGetImportTypeNodeModuleName";
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
  // need to do both - e.g import foo, { a, b as c } from "mod"

  const namedBindings = importDeclaration.importClause?.namedBindings;
  if (namedBindings) {
    if (ts.isNamedImports(namedBindings)) {
      // { a, b as c }
      // b as c - propertyName is b, name is c
      const imports = namedBindings.elements.map((importSpecifier) => {
        return importSpecifier.name.text;
      });
      importsInfo.add({
        imports,
        moduleName,
      });
    } else {
      const namespaceImport = namedBindings;
      importsInfo.add({
        imports: [namespaceImport.name.text],
        moduleName,
      });
    }
  }

  // this is default export
  if (importDeclaration.importClause?.name) {
    importsInfo.add({
      imports: [importDeclaration.importClause.name.text],
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

const getImportsInfo = (
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
      const moduleName = tryGetImportTypeNodeModuleName(ts, statement.type);
      if (moduleName !== undefined) {
        importsInfo.add({
          imports: [statement.name.text],
          moduleName,
        });
      }
    } else if (ts.isImportEqualsDeclaration(statement)) {
      const moduleReference = statement.moduleReference;
      if (ts.isExternalModuleReference(moduleReference)) {
        const expression = moduleReference.expression;
        if (ts.isStringLiteral(expression)) {
          const moduleName = expression.text;
          importsInfo.add({ imports: [statement.name.text], moduleName });
        }
      }
    }
    return importsInfo;
  }, new ImportsInfo());
};

export default getImportsInfo;
