/* eslint-disable @typescript-eslint/no-unused-vars */
// marker function
/* istanbul ignore next */
/**
 * This function is a marker function.  Invoke in code with a generic type that is imported. The transfomer will remove the call expression and replace with the imported module name.
 */
export default function transformToModuleName<T>(): string {
  throw new Error(
    "transformToModuleName should only be used as a marker function and should have been removed by the transformer",
  );
}
