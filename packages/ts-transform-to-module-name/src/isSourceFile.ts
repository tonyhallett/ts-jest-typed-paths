import ts, { SourceFile } from "typescript";
function isSourceFile(node: ts.Node): node is SourceFile {
  return ts.isSourceFile(node);
}
export default isSourceFile;
