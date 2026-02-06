import { ts as tsMorph } from "@ts-morph/bootstrap";
import { transformToModuleNameFactory } from "ts-transform-to-module-name";
import { transformStringToJsAsync } from "test-utils";

type BuiltTs = (typeof transformToModuleNameFactory)["arguments"][0];

describe("testing with ts-morph", () => {
  it("should work with typeof import as the generic parameter", async () => {
    const codeToTransform = `
        import { transformToModuleName } from "ts-transform-to-module-name";
        const noop = (str:string) => str;
        noop(transformToModuleName<typeof import('./exporting')>());
      `;

    const raiseDiagnostic = jest.fn();
    const transformer = () => {
      return transformToModuleNameFactory(
        tsMorph as unknown as BuiltTs,
        raiseDiagnostic,
      ) as unknown as tsMorph.TransformerFactory<tsMorph.SourceFile>;
    };

    const transformed = await transformStringToJsAsync(codeToTransform, {
      transforms: [transformer],
      sources: [
        {
          path: `./exporting.ts`,
          contents: `export default class ExportDefault {};`,
        },
      ],
      mocks: [
        {
          name: "ts-transform-to-module-name",
          content: `export function transformToModuleName<T>():string{ throw new Error("Marker fn"); }`,
        },
      ],
    });

    expect(raiseDiagnostic).not.toHaveBeenCalled();
    expect(transformed).toContain(`noop("./exporting");`);
  });
});
