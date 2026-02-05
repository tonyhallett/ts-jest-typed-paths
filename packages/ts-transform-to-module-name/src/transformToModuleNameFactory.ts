import type { TTypeScript } from "./ts";
import { SourceFile, TransformerFactory } from "typescript";
import {
  AdditionalTransformFactory,
  RaiseDiagnostic,
  SourceFileContext,
} from "./AdditionalTransformFactory";
import getImportsInfo from "./getImportsInfo";
import transform from "./transform";

const transformToModuleNameFactory = (
  ts: TTypeScript,
  raiseDiagnostic: RaiseDiagnostic,
  additionalTransformFactory?: AdditionalTransformFactory,
  moduleNameIfExportsTransformToModuleName?: string,
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
        moduleNameIfExportsTransformToModuleName,
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
