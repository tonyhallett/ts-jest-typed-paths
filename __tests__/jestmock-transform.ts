import transformToModuleName from "ts-jest-typed-path/transformToModuleName";
import { ExportedType } from "./exporting";
import { AClass } from "./exporting";
type ThingType = typeof import("./exporting").thing;
type X = import("./exporting").ExportedType;
import NotMocked from "./not-mocked";
import MockedDefaultExport from "./default-export-mocked";
import * as Ns from "./namespaced-mocked";
jest.mock(transformToModuleName<ThingType>());
jest.mock(transformToModuleName<typeof import("./exporting").thing>());
jest.mock(transformToModuleName<AClass>());
jest.mock(transformToModuleName<ExportedType>());
jest.mock(transformToModuleName<X>());
jest.mock(transformToModuleName<import("./exporting").ExportedType>());
jest.mock(transformToModuleName<MockedDefaultExport>());
jest.mock(transformToModuleName<typeof Ns>());
jest.mock(transformToModuleName<typeof Ns>(), () => {
  return {
    x: "y",
  };
});
jest.mock(transformToModuleName<ThingType>()).dontMock(transformToModuleName<ThingType>());

describe("transforer", () => {
  it("should work", () => {
    jest.doMock(transformToModuleName<ThingType>());
    new NotMocked();
  });
});
