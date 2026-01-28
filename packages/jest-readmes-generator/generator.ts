import * as fs from "fs";
import * as path from "path";
import transpileTest from "./transpile";
import prettier from "prettier";

export const baseReadme = getBaseReadme();
const packagesDirectory = path.join(__dirname, "..");

export async function generateReadmeForPackage(packageName: string) {
  const { packageDirectory, readmePath } = getReadmePathInfo(packageName);
  let readme =
    generatePrefix(packageName, baseReadme) +
    getExampleUsage(packageDirectory) +
    readConfig(packageDirectory);

  readme = await formatMarkdown(readme, readmePath);
  return {
    readmePath,
    readme,
  };
}

export function getReadmePathInfo(packageName: string) {
  const packageDirectory = path.join(packagesDirectory, packageName);
  if (!fs.existsSync(packageDirectory)) {
    throw new Error(`Package directory does not exist: ${packageDirectory}`);
  }
  return {
    packageDirectory,
    readmePath: path.join(packageDirectory, "README.md"),
  };
}

function getExampleUsage(packageDirectory: string) {
  const examplePath = readPackageJsonJestReadmeTestPath(packageDirectory);
  const exampleFullPath = path.resolve(packageDirectory, examplePath);
  if (!fs.existsSync(exampleFullPath)) {
    throw new Error(`Example file does not exist: ${exampleFullPath}`);
  }

  const transpiled = transpileTest(exampleFullPath);

  const examplePathTrimmed = examplePath.replace(/^\.\.\//, "");
  const examplePackageName = examplePathTrimmed.split("/")[0];
  const exampleContent = fs.readFileSync(exampleFullPath, "utf-8");
  return `
## Example Usage

[${examplePackageName}](../${examplePathTrimmed})

${fencedCodeBlock(exampleContent)}

## Transformed Code

${fencedCodeBlock(transpiled)}

`;
}

function readPackageJsonJestReadmeTestPath(packageDirectory: string) {
  const packageJsonPath = path.join(packageDirectory, "package.json");
  const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
  const packageJson = JSON.parse(packageJsonContent);
  if (!packageJson.jestReadme || !packageJson.jestReadme.testPath) {
    throw new Error(`jestReadme.testPath not found in package.json of ${packageDirectory}`);
  }
  return packageJson.jestReadme.testPath;
}

function readConfig(packageDirectory: string) {
  return fs.readFileSync(path.join(packageDirectory, "readmeConfig.md"), "utf-8");
}

function generatePrefix(packageName: string, baseReadme: string) {
  return `# ${packageName}

${baseReadme}`;
}

function getBaseReadme() {
  const baseReadmePath = path.join(__dirname, "jest-base-readme.md");
  return fs.readFileSync(baseReadmePath, "utf-8");
}

function fencedCodeBlock(code: string, language: string = "ts"): string {
  return `\`\`\`${language}
${code}
\`\`\``;
}

async function formatMarkdown(content: string, filePath: string): Promise<string> {
  const config = await prettier.resolveConfig(filePath);

  return prettier.format(content, {
    ...config,
    filepath: filePath, // critical: enables markdown parser + plugins
  });
}
