import Ts from "typescript";
import * as Path from "path";
import { createProject, Project } from "@ts-morph/bootstrap";

/*
  code taken from ts-transformer-testing-library
  Updated for later @ts-morph/bootstrap
*/

export type TransformerFn = (program: Ts.Program) => Ts.TransformerFactory<Ts.SourceFile>;

export class Transformer {
  private compilerOptions: Ts.CompilerOptions = {};
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

  public setCompilerOptions(options: Ts.CompilerOptions): Transformer {
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
  compilerOptions?: Partial<Ts.CompilerOptions>;
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

  project.createSourceFile(file.path, file.contents);

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

  const { emitSkipped, diagnostics } = program.emit(
    program.getSourceFile(file.path),
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

  const inFile = program.getSourceFile(file.path);

  if (!inFile) {
    throw new Error(`Could not get SourceFile for ${file.path}`);
  }

  if (!inFile) {
    throw new Error(`Could not determine ArtifactFile for ${file.path}`);
  }

  const fileArtifactPath = getFileArtifactPath(inFile, program);

  if (!fileArtifactPath) {
    throw new Error(`Could not determine fileArtifactPath for ${file.path}`);
  }

  return String(project.fileSystem.readFileSync(fileArtifactPath));
};

export function getCompilerOptions(options?: Partial<Ts.CompilerOptions>): Ts.CompilerOptions {
  return {
    outDir: "/dist",
    lib: ["/node_modules/typescript/lib/lib.esnext.full.d.ts"],
    module: Ts.ModuleKind.ESNext,
    moduleResolution: Ts.ModuleResolutionKind.NodeJs,
    resolveJsonModule: true,
    skipLibCheck: true,
    target: Ts.ScriptTarget.ESNext,
    types: [],
    noEmitOnError: true,
    jsx: Ts.JsxEmit.Preserve,
    ...(options || {}),
  };
}

function getFileArtifactPath(file: Ts.SourceFile, program: Ts.Program): string | undefined {
  const options = program.getCompilerOptions();
  const extname = Path.extname(file.fileName);
  const basename = Path.basename(file.fileName, extname);

  const artifactExtname =
    extname === ".tsx" && options.jsx === Ts.JsxEmit.Preserve ? ".jsx" : ".js";

  return Path.join(options.outDir || ".", `${basename}${artifactExtname}`);
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
