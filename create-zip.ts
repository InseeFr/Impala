#!/usr/bin/env node

import { ZipArchive } from "archiver";
import { createWriteStream } from "node:fs";
import { resolve } from "node:path";

const output = createWriteStream(resolve("build", "build.zip"));
const archive = new ZipArchive({
    zlib: { level: 9 }
});

output.on("close", () => {
    console.log(`Created build.zip (${archive.pointer()} bytes)`);
});

archive.on("error", (err: Error) => {
    throw err;
});

archive.pipe(output);
archive.glob("**/*", { cwd: "build", ignore: ["build.zip"] });
archive.finalize();
