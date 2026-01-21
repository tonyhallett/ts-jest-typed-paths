import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export default function createTarballs(packages:string[],tarballDir?:string) {
    const root = path.resolve(__dirname, "..", "..", "..");
    tarballDir = tarballDir ?? path.join(root, ".tmp-integration");

    fs.rmSync(tarballDir, { recursive: true, force: true });
    fs.mkdirSync(tarballDir, { recursive: true });

    function run(cmd:string, cwd = root) {
    execSync(cmd, { cwd, stdio: "inherit" });
    }

    run("npm run build");
    
    for(const pkg of packages){
        run(`npm pack -w packages/${pkg}`);
    }

    // 3. Move tarballs
    for (const file of fs.readdirSync(root)) {
        if (file.endsWith(".tgz")) {
            fs.renameSync(path.join(root, file), path.join(tarballDir, file));
        }
    }
    return tarballDir;
}
