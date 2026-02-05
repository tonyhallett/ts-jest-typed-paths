import { ImportDeclaration } from "typescript";
import tryGetImportTypeNodeModuleName from "./tryGetImportTypeNodeModuleName";
import { packageName } from "./package-name";
import { getTransformToModuleNameName } from "./transformToModuleName-ast";
import { TTypeScript } from "./ts";
import { SourceFileTs } from "./common-types";

export interface ImportInfo {
  moduleName: string;
  names: string[];
}

export class ImportsInfo {
  private imports: ImportInfo[] = [];
  add(importInfo: ImportInfo) {
    this.imports.push(importInfo);
  }
  transformToModuleNameName: string | undefined;

  getModuleName(name: string) {
    return this.imports.find((importInfo) => importInfo.names.includes(name))?.moduleName;
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
        names: imports,
        moduleName,
      });
    } else {
      const namespaceImport = namedBindings;
      importsInfo.add({
        names: [namespaceImport.name.text],
        moduleName,
      });
    }
  }

  // this is default export
  if (importDeclaration.importClause?.name) {
    importsInfo.add({
      names: [importDeclaration.importClause.name.text],
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
  sourceFileTs: SourceFileTs,
  moduleNameIfExportsTransformToModuleName: ModuleNameIfExportsTransformToModuleName,
): ImportsInfo => {
  const { ts, sourceFile } = sourceFileTs;
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
          names: [statement.name.text],
          moduleName,
        });
      }
    } else if (ts.isImportEqualsDeclaration(statement)) {
      const moduleReference = statement.moduleReference;
      if (ts.isExternalModuleReference(moduleReference)) {
        const expression = moduleReference.expression;
        if (ts.isStringLiteral(expression)) {
          const moduleName = expression.text;
          importsInfo.add({ names: [statement.name.text], moduleName });
        }
      }
    }
    return importsInfo;
  }, new ImportsInfo());
};

export default getImportsInfo;
