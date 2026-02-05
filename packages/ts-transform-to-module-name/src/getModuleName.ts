import type { ImportsInfo } from "./getImportsInfo";
import { TypeNameOrModuleName } from "./getTypeNameOrModuleName";

export function getModuleName(
  typeNameOrModuleName: TypeNameOrModuleName,
  importsInfo: ImportsInfo,
): string | undefined {
  return typeNameOrModuleName.isTypeName
    ? importsInfo.getModuleName(typeNameOrModuleName.typeNameOrModuleName)
    : typeNameOrModuleName.typeNameOrModuleName;
}
