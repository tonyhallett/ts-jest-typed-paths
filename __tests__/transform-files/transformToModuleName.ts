import {transformToModuleName} from "ts-jest-typed-paths";
import { ExportedType } from "../imported/exporting";
import { AClass } from "../imported/exporting";
type ThingType = typeof import("../imported/exporting").thing;
type X = import("../imported/exporting").ExportedType;
import NotMocked from "../imported/not-mocked";
import MockedDefaultExport from "../imported/default-export-mocked";
import * as Ns from "../imported/namespaced-mocked";
jest.mock(transformToModuleName<ThingType>());
jest.mock(transformToModuleName<typeof import("../imported/exporting").thing>());
jest.mock(transformToModuleName<AClass>());
jest.mock(transformToModuleName<ExportedType>());
jest.mock(transformToModuleName<X>());
jest.mock(transformToModuleName<import("../imported/exporting").ExportedType>());
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
