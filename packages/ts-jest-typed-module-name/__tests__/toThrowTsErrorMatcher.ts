export const toThrowTsErrorMatcher = (
  received: () => void,
  diagnosticMessage: string,
  diagnosticCodes: number[],
) => {
  /*
    internal to ts-jest
    https://github.com/kulshekhar/ts-jest/blob/main/src/utils/ts-error.ts
  */
  interface TSError extends Error {
    name: "TSError";
    diagnosticText: string;
    diagnosticCodes: number[];
  }

  try {
    received();
  } catch (e) {
    if (e instanceof Error && e.name === "TSError") {
      const tsError = e as TSError;
      const pass =
        tsError.message.includes(diagnosticMessage) &&
        diagnosticCodes.every((code) => tsError.diagnosticCodes.includes(code));
      if (pass) {
        return {
          pass: true,
          message: () => "Passed",
        } satisfies jest.CustomMatcherResult;
      } else {
        return {
          pass: false,
          message: () =>
            `Expected TSError to have message including "${diagnosticMessage}" and diagnostic codes [${diagnosticCodes.join(", ")}] but got message "${tsError.message}" and diagnostic codes [${tsError.diagnosticCodes.join(", ")}]`,
        } satisfies jest.CustomMatcherResult;
      }
    } else {
      return {
        pass: false,
        message: () => `Expected TSError but received ${e}`,
      } satisfies jest.CustomMatcherResult;
    }
  }

  return {
    pass: false,
    message: () => `Expected TSError but no error was thrown`,
  } satisfies jest.CustomMatcherResult;
};
