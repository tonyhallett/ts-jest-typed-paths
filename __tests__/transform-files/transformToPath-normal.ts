import { ExportedType } from "../imported/exporting";
import { AClass } from "../imported/exporting";
type ThingType = typeof import("../imported/exporting").thing;
type X = import("../imported/exporting").ExportedType;
import NotMocked from "../imported/not-mocked";
import * as Ns from "../imported/namespaced-mocked";
jest.mock("../imported/exporting");
jest.mock("../imported/exporting");
jest.mock("../imported/exporting");
jest.mock("../imported/exporting");
jest.mock("../imported/exporting");
jest.mock("../imported/exporting");
jest.mock("../imported/default-export-mocked");
jest.mock("../imported/namespaced-mocked");
jest.mock("../imported/namespaced-mocked", () => {
  return {
    x: "y",
  };
});
jest.mock("../imported/exporting").dontMock("../imported/exporting");

describe("transforer", () => {
  it("should work", () => {
    jest.doMock("../imported/exporting");
    new NotMocked();
  });
});
