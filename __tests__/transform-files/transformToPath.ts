import {transformToPath} from "ts-jest-typed-paths";
import { ExportedType } from "../imported/exporting";
import { AClass } from "../imported/exporting";
type ThingType = typeof import("../imported/exporting").thing;
type X = import("../imported/exporting").ExportedType;
import NotMocked from "../imported/not-mocked";
import MockedDefaultExport from "../imported/default-export-mocked";
import * as Ns from "../imported/namespaced-mocked";
jest.mock(transformToPath<ThingType>());
jest.mock(transformToPath<typeof import("../imported/exporting").thing>());
jest.mock(transformToPath<AClass>());
jest.mock(transformToPath<ExportedType>());
jest.mock(transformToPath<X>());
jest.mock(transformToPath<import("../imported/exporting").ExportedType>());
jest.mock(transformToPath<MockedDefaultExport>());
jest.mock(transformToPath<typeof Ns>());
jest.mock(transformToPath<typeof Ns>(), () => {
  return {
    x: "y",
  };
});
jest.mock(transformToPath<ThingType>()).dontMock(transformToPath<ThingType>());

describe("transforer", () => {
  it("should work", () => {
    jest.doMock(transformToPath<ThingType>());
    new NotMocked();
  });
});
