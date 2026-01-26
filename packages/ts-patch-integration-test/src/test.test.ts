import toTest from "./to-test";
import dependency from "./dependency";
import ttmn from "ts-patch-jest-typed-module-name";
jest.mock<typeof dependency>("");

describe("transformer", () => {
  it("should transform jest.mock", () => {
    toTest();
    expect(dependency).toHaveBeenCalled();
  });

  it("should transformToModuleName", () => {
    expect(ttmn<typeof dependency>()).toBe("./dependency");
  });
});
