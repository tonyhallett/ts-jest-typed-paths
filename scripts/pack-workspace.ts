import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const distDirectory = path.resolve(__dirname, "..", "dist");
if (!fs.existsSync(distDirectory)) {
  fs.mkdirSync(distDirectory);
}

const packagesDirectory = path.resolve(__dirname, "..", "./packages");
const packages = fs.readdirSync(packagesDirectory);
const nonPrivatePackages = packages.filter((pkg) => {
  const pkgJsonPath = path.join(packagesDirectory, pkg, "package.json");
  // read
  if (fs.existsSync(pkgJsonPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    return !pkgJson.private;
  }
});
const command = nonPrivatePackages.map((pkg) => `-w packages/${pkg}`).join(" ");
execSync(`npm pack --pack-destination dist ${command}`, { stdio: "inherit" });
