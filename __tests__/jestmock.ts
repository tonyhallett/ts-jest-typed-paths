import { ExportedType } from "./exporting";
import { AClass } from "./exporting";
type ThingType = typeof import("./exporting").thing;
type X = import("./exporting").ExportedType;
import NotMocked from "./not-mocked";
import * as Ns from "./namespaced-mocked";
jest.mock("./exporting");
jest.mock("./exporting");
jest.mock("./exporting");
jest.mock("./exporting");
jest.mock("./exporting");
jest.mock("./exporting");
jest.mock("./default-export-mocked");
jest.mock("./namespaced-mocked");
jest.mock("./namespaced-mocked", () => {
  return {
    x: "y",
  };
});
jest.mock("./exporting").dontMock("./exporting");

describe("transforer", () => {
  it("should work", () => {
    jest.doMock("./exporting");
    new NotMocked();
  });
});
