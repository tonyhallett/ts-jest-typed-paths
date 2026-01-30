import { createProject, Project, ts } from "@ts-morph/bootstrap";
/*
  code taken from ts-transformer-testing-library
  Updated for later @ts-morph/bootstrap and improved
*/

export type TransformerFn = (program: ts.Program) => ts.TransformerFactory<ts.SourceFile>;

export class Transformer {
  private compilerOptions: ts.CompilerOptions = {};
  private filePath?: string;
  private file?: File;
  private mocks: ModuleDescriptor[] = [];
  private sources: File[] = [];
  private transformers: TransformerFn[] = [];
  private project?: Project;

  private clone() {
    return Object.assign(new Transformer(), this);
  }

  public addMock(moduleDescriptor: ModuleDescriptor): Transformer {
    this.mocks.push(moduleDescriptor);
    return this.clone();
  }

  public addSource(source: File): Transformer {
    this.sources.push(source);
    return this;
  }

  public addTransformer(transformer: TransformerFn): Transformer {
    this.transformers.push(transformer);
    return this;
  }

  public addTransformers(transformers: TransformerFn[]): Transformer {
    this.transformers.push(...transformers);
    return this;
  }

  public setCompilerOptions(options: ts.CompilerOptions): Transformer {
    this.compilerOptions = options;

    if (this.project) {
      this.project.compilerOptions.set(options);
    }

    return this;
  }

  public setFile(file: File): Transformer {
    this.file = file;
    return this;
  }

  public setFilePath(filePath: string): Transformer {
    this.filePath = filePath;
    return this;
  }

  public async transformAsync(input?: string): Promise<string> {
    this.project =
      this.project ||
      (await createProject({
        useInMemoryFileSystem: true,
        compilerOptions: getCompilerOptions(this.compilerOptions),
      }));

    const filePath = typeof this.filePath === "string" ? this.filePath : "/index.ts";

    const file = typeof input === "string" ? { path: filePath, contents: input } : this.file;

    if (!file) {
      throw new Error(`transform must be called on Transformer with file or with string input`);
    }

    return transformFileAsync(file, {
      project: this.project,
      compilerOptions: this.compilerOptions,
      mocks: this.mocks,
      sources: this.sources,
      transforms: this.transformers,
    });
  }
}

/**
 * @alpha
 */
export interface ModuleDescriptor {
  name: string;
  content: string;
}

/**
 * @alpha
 */
export interface File {
  /* Absolute path to file */
  path: string;
  /* Contents of file */
  contents: string;
}

/**
 * @alpha
 */
export interface TransformFileOptions {
  /* A ts-morph project to use and reuse */
  project?: Project;
  /* Sources to add to virtual filesystem. */
  sources?: ReadonlyArray<File>;
  /* Mock modules to add to the project context. */
  mocks?: ReadonlyArray<ModuleDescriptor>;
  /* Options to pass to tsc */
  compilerOptions?: Partial<ts.CompilerOptions>;
  /* TypeScript transform to apply to the compilation */
  transforms: TransformerFn[];
}

/**
 * Transform a TypeScript file given a project context and transform function
 * in a virtual filesystem
 *
 * @example
 * ```ts
 * const file = {
 *   path: '/index.ts',
 *   contents: `
 *     import { world } from "./world";
 *     console.log("Hello,", world);
 *   `
 * };
 *
 * const sources = [
 *  {
 *    path: '/world.ts',
 *    contents: `export const world = 'World'`
 *  }
 * ];
 *
 * transformFile(file, {
 *   sources,
 *   transform() { ... }
 * })
 * ```
 *
 * @alpha
 * @param file - File to use as project root
 * @param options - Options providing context to the transformation
 */
export const transformFileAsync = async (
  file: File,
  options: TransformFileOptions,
): Promise<string> => {
  const project =
    options.project ||
    (await createProject({
      useInMemoryFileSystem: true,
      compilerOptions: getCompilerOptions(options.compilerOptions),
    }));

  const inFile = project.createSourceFile(file.path, file.contents);

  (options.sources || []).forEach((source) =>
    project.createSourceFile(source.path, source.contents),
  );

  (options.mocks || []).forEach((mock) => {
    const base = `/node_modules/${mock.name}`;
    project.createSourceFile(`${base}/index.ts`, mock.content);
    project.fileSystem.writeFileSync(
      `${base}/package.json`,
      JSON.stringify({ name: mock.name, main: "./src/index.ts" }),
    );
  });

  const program = project.createProgram();

  const { emitSkipped, diagnostics, emittedFiles } = program.emit(
    inFile,
    undefined,
    undefined,
    false,
    {
      before: options.transforms.map((t) => t(program)),
    },
  );

  if (emitSkipped) {
    throw new Error(project.formatDiagnosticsWithColorAndContext(diagnostics));
  }

  return project.fileSystem.readFileSync(emittedFiles![0]);
};

export function getCompilerOptions(options?: Partial<ts.CompilerOptions>): ts.CompilerOptions {
  return {
    outDir: "/dist",
    lib: ["/node_modules/typescript/lib/lib.esnext.full.d.ts"],
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    resolveJsonModule: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ESNext,
    types: [],
    noEmitOnError: true,
    jsx: ts.JsxEmit.Preserve,
    ...(options || {}),
    listEmittedFiles: true,
  };
}

export const transformStringAsync = (
  source: string,
  options: TransformFileOptions,
): Promise<string> => {
  return transformFileAsync(
    {
      path: "/index.ts",
      contents: source,
    },
    options,
  );
};
