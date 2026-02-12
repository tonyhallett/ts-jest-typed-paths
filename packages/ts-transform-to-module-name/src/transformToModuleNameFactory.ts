import type { TTypeScript } from "./ts";
import type { SourceFile, TransformerFactory } from "typescript";
import type {
  AdditionalTransformFactory,
  RaiseDiagnostic,
  SourceFileContext,
} from "./AdditionalTransformFactory";
import type transformToModuleName from "./transformToModuleName";
import getImportsInfo from "./getImportsInfo";
import transform from "./transform";

/**
 * A factory for creating a {@link TransformerFactory | `TransformerFactory<SourceFile>`} ( e.g for use with ts.transform, ts.transpileModule, ts.Program.emit ts-patch)
 * that transforms calls to a marker, either the provided {@link transformToModuleName} or provided by the param {@link moduleNameExportingTransformToModuleName},
 * to the module name of the type argument of transformToModuleName.
 *
 * @param ts Host provided specific typescript namespace to be used
 * @param raiseDiagnostic Host provided function to raise diagnostics, used for unsupported type nodes in transformToModuleName type argument and other diagnostics from the additionalTransformFactory.
 * @param additionalTransformFactory {@link AdditionalTransformFactory} An optional factory to create an additional transform for the source file nodes. The additional transform will be applied on non transformToModuleName nodes. If the additional transform factory returns undefined and no transformToModuleName import then the source file is not visited.
 * @param moduleNameExportingTransformToModuleName If another module exports a named transformToModuleName or has a default export of transformToModuleName shape, the name of that module.
 */
const transformToModuleNameFactory = (
  ts: TTypeScript,
  raiseDiagnostic: RaiseDiagnostic,
  additionalTransformFactory?: AdditionalTransformFactory,
  moduleNameExportingTransformToModuleName?: string,
): TransformerFactory<SourceFile> => {
  const transformerFactory: TransformerFactory<SourceFile> = (context) => {
    return (sourceFile) => {
      const sourceFileContext: SourceFileContext = {
        ts,
        sourceFile,
        transformationContext: context,
      };
      const importsInfo = getImportsInfo(
        sourceFileContext,
        moduleNameExportingTransformToModuleName,
      );
      if (
        importsInfo.transformToModuleNameName !== undefined ||
        additionalTransformFactory !== undefined
      ) {
        return transform(
          sourceFileContext,
          raiseDiagnostic,
          additionalTransformFactory,
          importsInfo,
        );
      }
      return sourceFile;
    };
  };

  return transformerFactory;
};

export default transformToModuleNameFactory;
