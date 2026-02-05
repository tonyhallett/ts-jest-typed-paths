import { SourceFile } from "typescript";
import { TTypeScript } from "./ts";

export interface SourceFileTs {
  ts: TTypeScript;
  sourceFile: SourceFile;
}
