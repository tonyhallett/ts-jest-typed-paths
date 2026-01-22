import toTest from "../src/to-test";
import dependency from "../src/dependency";
import tp from "ts-jest-typed-module-name";
jest.mock<typeof dependency>("");

describe("transformer", () => {
  it("should transform jest.mock", () => {
    toTest();
    expect(dependency).toHaveBeenCalled();
  });

  it("should transformToModuleName", () => {
    expect(tp<typeof dependency>()).toBe("../src/dependency");
  });
});
