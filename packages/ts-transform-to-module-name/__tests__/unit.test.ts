import getImportsInfo from "../src/getImportsInfo";
import ts from "typescript";

describe("getImportsInfo", () => {
  describe("transformToModuleNameName", () => {
    it("should get its own", () => {
      const sourceFile = ts.createSourceFile(
        "",
        "import { transformToModuleName} from 'ts-transform-to-module-name'",
        ts.ScriptTarget.ES2015,
      );
      const importsInfo = getImportsInfo(ts, sourceFile, undefined);
      expect(importsInfo.transformToModuleNameName).toEqual("transformToModuleName");
    });

    it("should get its own aliased", () => {
      const sourceFile = ts.createSourceFile(
        "",
        "import { transformToModuleName as ttmn} from 'ts-transform-to-module-name'",
        ts.ScriptTarget.ES2015,
      );
      const importsInfo = getImportsInfo(ts, sourceFile, undefined);
      expect(importsInfo.transformToModuleNameName).toEqual("ttmn");
    });

    it("should get from re-exporting named export", () => {
      const sourceFile = ts.createSourceFile(
        "",
        "import { transformToModuleName} from 'reexport'",
        ts.ScriptTarget.ES2015,
      );
      const importsInfo = getImportsInfo(ts, sourceFile, "reexport");
      expect(importsInfo.transformToModuleNameName).toEqual("transformToModuleName");
    });

    it("should get from re-exporting aliased named export", () => {
      const sourceFile = ts.createSourceFile(
        "",
        "import { transformToModuleName as ttmn} from 'reexport'",
        ts.ScriptTarget.ES2015,
      );
      const importsInfo = getImportsInfo(ts, sourceFile, "reexport");
      expect(importsInfo.transformToModuleNameName).toEqual("ttmn");
    });

    it("should get from re-exporting default export", () => {
      const sourceFile = ts.createSourceFile(
        "",
        "import ttmn from 'reexport'",
        ts.ScriptTarget.ES2015,
      );
      const importsInfo = getImportsInfo(ts, sourceFile, "reexport");
      expect(importsInfo.transformToModuleNameName).toEqual("ttmn");
    });
  });

  describe("imports", () => {
    it("should work with named exports", () => {
      const sourceFile = ts.createSourceFile(
        "",
        "import { a, b as c} from 'mod'",
        ts.ScriptTarget.ES2015,
      );
      const importsInfo = getImportsInfo(ts, sourceFile, undefined);
      expect(importsInfo.getModuleName("a")).toEqual("mod");
      expect(importsInfo.getModuleName("c")).toEqual("mod");
    });

    it("should work with default export", () => {
      const sourceFile = ts.createSourceFile(
        "",
        "import chosenname from 'mod'",
        ts.ScriptTarget.ES2015,
      );
      const importsInfo = getImportsInfo(ts, sourceFile, undefined);
      expect(importsInfo.getModuleName("chosenname")).toEqual("mod");
    });

    it("should work with default export and named exports", () => {
      const sourceFile = ts.createSourceFile(
        "",
        "import chosenname, { a } from 'mod'",
        ts.ScriptTarget.ES2015,
      );
      const importsInfo = getImportsInfo(ts, sourceFile, undefined);
      expect(importsInfo.getModuleName("chosenname")).toEqual("mod");
      expect(importsInfo.getModuleName("a")).toEqual("mod");
    });
  });
});
