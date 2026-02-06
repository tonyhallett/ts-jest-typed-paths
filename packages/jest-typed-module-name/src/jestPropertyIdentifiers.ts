/*
  jest types from either
  https://github.com/jestjs/jest/blob/main/packages/jest-environment/src/index.ts
  https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/jest/index.d.ts
*/
export default [
  "doMock",
  "mock",
  "unstable_mockModule",
  "setMock", // generic in definitely typed
  "createMockFromModule",
  "requireActual",
  "requireMock",
  // https://jestjs.io/docs/upgrading-to-jest30#jestgenmockfrommodule-removed
  // deprecated - use createMockFromModule
  "genMockFromModule",
];
