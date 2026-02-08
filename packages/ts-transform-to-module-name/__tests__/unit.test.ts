import getImportsInfo, { ImportsInfo } from "../src/getImportsInfo";
import createModuleNameFromTypeNode, {
  RaiseUnsupportedTypeNodeDiagnostic,
} from "../src/createModuleNameFromTypeNode";
import ts, { ExpressionStatement } from "typescript";

const createSourceFileTs = (content: string) => ({
  sourceFile: ts.createSourceFile("", content, ts.ScriptTarget.ES2015),
  ts,
});

describe("getImportsInfo", () => {
  const doGetImportsInfo = (content: string, moduleNameToFind?: string) => {
    const sourceFileTs = createSourceFileTs(content);
    return getImportsInfo(sourceFileTs, moduleNameToFind);
  };
  describe("transformToModuleNameName", () => {
    it("should get its own", () => {
      transformToModuleNameTest(
        "import { transformToModuleName} from 'ts-transform-to-module-name'",
        "transformToModuleName",
      );
    });

    it("should get its own aliased", () => {
      transformToModuleNameTest(
        "import { transformToModuleName as ttmn} from 'ts-transform-to-module-name'",
        "ttmn",
      );
    });

    it("should get from re-exporting named export", () => {
      transformToModuleNameTest(
        "import { transformToModuleName} from 'reexport'",
        "transformToModuleName",
        "reexport",
      );
    });

    it("should get from re-exporting aliased named export", () => {
      transformToModuleNameTest(
        "import { transformToModuleName as ttmn} from 'reexport'",
        "ttmn",
        "reexport",
      );
    });

    it("should not get from re-exporting if is not named transformToModuleName", () => {
      transformToModuleNameTest("import { ttmn} from 'reexport'", undefined, "reexport");
    });

    it("should get from re-exporting default export", () => {
      transformToModuleNameTest("import ttmn from 'reexport'", "ttmn", "reexport");
    });

    const transformToModuleNameTest = (
      content: string,
      expected: string | undefined,
      moduleNameIfExportsTransformToModuleName?: string,
    ) => {
      const importsInfo = doGetImportsInfo(content, moduleNameIfExportsTransformToModuleName);
      expect(importsInfo.transformToModuleNameName).toEqual(expected);
    };
  });

  describe("imports", () => {
    it("should work with named exports", () => {
      const importsInfo = doGetImportsInfo("import { a, b as c} from 'mod'");
      expect(importsInfo.getModuleName("a")).toEqual("mod");
      expect(importsInfo.getModuleName("c")).toEqual("mod");
    });

    it("should work with default export", () => {
      const importsInfo = doGetImportsInfo("import chosenname from 'mod'");
      expect(importsInfo.getModuleName("chosenname")).toEqual("mod");
    });

    it("should work with default export and named exports", () => {
      const importsInfo = doGetImportsInfo("import chosenname, { a } from 'mod'");
      expect(importsInfo.getModuleName("chosenname")).toEqual("mod");
      expect(importsInfo.getModuleName("a")).toEqual("mod");
    });

    it("should work with import equals", () => {
      const importsInfo = doGetImportsInfo("import chosenname = require('mod')");
      expect(importsInfo.getModuleName("chosenname")).toEqual("mod");
    });

    it("should work with namespace import", () => {
      const importsInfo = doGetImportsInfo("import * as chosenname from 'mod'");
      expect(importsInfo.getModuleName("chosenname")).toEqual("mod");
    });

    it("should work with type aliases", () => {
      const imports = [
        "typeof import('./demoExport');",
        "import('./demoExport').IFace;",
        "typeof import('./demoExport').value;",
      ];
      imports.forEach((importStr) => {
        const importsInfo = doGetImportsInfo(`type T = ${importStr}`);
        expect(importsInfo.getModuleName("T")).toEqual("./demoExport");
      });
    });
  });
});

describe("getTypeNameOrModuleName", () => {
  it("should work with type references", () => {
    expect(doTest("T", ["X", "T"])).toEqual("mod");
    expect(doTest("demoExportEquals.IFace", ["demoExportEquals"])).toEqual("mod");
    /*
      import demoExportEquals = require("./demoExport");
      genericFn<demoExportEquals.IFace>();
    */
  });

  it("should work with type queries", () => {
    expect(doTest("typeof T", ["T"])).toEqual("mod");
  });

  it("should work with import types", () => {
    expect(doTest("typeof import('other')")).toEqual("other");
    expect(doTest("typeof import('other').value")).toEqual("other");
    expect(doTest("import('other').IFace")).toEqual("other");
  });

  it("should raise diagnostic for unsupported type nodes", () => {
    const raiser = jest.fn();
    // literal type node
    doTest("{a:number}", [], raiser);
    expect(raiser).toHaveBeenCalledWith({ start: 10, length: 10 }, "member");
  });

  it("should raise diagnostic for types without imports", () => {
    const raiser = jest.fn();
    doTest("T", [], raiser);
    expect(raiser).toHaveBeenCalledWith({ start: 10, length: 1 }, "member");
  });

  function doTest(
    typeArg: string,
    names: string[] = [],
    raiser: RaiseUnsupportedTypeNodeDiagnostic = () => {},
  ) {
    const importsInfo: ImportsInfo = new ImportsInfo();
    importsInfo.add({ moduleName: "mod", names });
    const sourceFileTs = createSourceFileTs(`genericFn<${typeArg}>()`);
    const moduleNameFromTypeNode = createModuleNameFromTypeNode(sourceFileTs, importsInfo, raiser);

    const typeArgument = (
      (sourceFileTs.sourceFile.statements[0] as ExpressionStatement).expression as ts.CallExpression
    ).typeArguments![0];
    return moduleNameFromTypeNode(typeArgument, "member");
  }
});
