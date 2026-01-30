import { createProject, Project, ts } from "@ts-morph/bootstrap";
/*
  code adapted from from ts-transformer-testing-library
  Updated for later @ts-morph/bootstrap and improved
*/

export type TransformerFn = (program: ts.Program) => ts.TransformerFactory<ts.SourceFile>;

export interface ModuleDescriptor {
  name: string;
  content: string;
}

export interface File {
  /* Absolute path to file */
  path: string;
  /* Contents of file */
  contents: string;
}

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

export const transformStringAsync = (
  source: string,
  options: TransformFileOptions,
): Promise<string> => {
  return transformFileToJsAsync(
    {
      path: "/index.ts",
      contents: source,
    },
    options,
  );
};

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
 * transformFileToJsAsync(file, {
 *   sources,
 *   transform() { ... }
 * })
 * ```
 *
 * @alpha
 * @param file - File to use as project root
 * @param options - Options providing context to the transformation
 */
export const transformFileToJsAsync = async (
  file: File,
  options: TransformFileOptions,
): Promise<string> => {
  const project = await getProject(options);

  const inFile = createFilesReturnInFile(project, options, file);

  return emit(project, inFile, options.transforms);
};

function emit(project: Project, inFile: ts.SourceFile, transforms: TransformerFn[]): string {
  const program = project.createProgram();

  /*
    if options noEmitOnError has not been changed to false
    and there are errors then emitSkipped will be true and diagnostics
    are those that could receive from the program
    getSyntacticDiagnostics, getSemanticDiagnostics, getGlobalDiagnostics
  */
  const { emitSkipped, diagnostics, emittedFiles } = program.emit(
    inFile, // if not provided then is all source files
    undefined,
    undefined,
    false,
    {
      before: transforms.map((t) => t(program)),
    },
  );

  if (emitSkipped) {
    throw new Error(project.formatDiagnosticsWithColorAndContext(diagnostics));
  }

  // fixed option list emitted files
  /*
    compilerOptions have fixed
    listEmittedFiles: true              - to get emittedFiles returned
    declaration: false                  - to avoid .d.ts files being emitted
  */
  return project.fileSystem.readFileSync(emittedFiles![0]);
}

async function getProject(options: TransformFileOptions): Promise<Project> {
  if (options.project) {
    const existingOptions = options.project.compilerOptions.get();
    options.project.compilerOptions.set(getSingleEmittedFilesCompilerOptions(existingOptions));
    return options.project;
  }
  return await createProject({
    useInMemoryFileSystem: true,
    compilerOptions: getSingleEmittedFilesCompilerOptions(
      getCompilerOptions(options.compilerOptions),
    ),
  });
}

const defaultCompilerOptions: ts.CompilerOptions = {
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
};

// necessary for the behaviour in the test
const overrideCompilerOptions: ts.CompilerOptions = {
  listEmittedFiles: true,
  declaration: false,
};

function getSingleEmittedFilesCompilerOptions(options: ts.CompilerOptions) {
  return {
    ...options,
    ...overrideCompilerOptions,
  };
}

function getCompilerOptions(options?: ts.CompilerOptions): ts.CompilerOptions {
  return { ...defaultCompilerOptions, ...(options || {}) };
}

function createFilesReturnInFile(project: Project, options: TransformFileOptions, file: File) {
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
  return inFile;
}
