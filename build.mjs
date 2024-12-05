import esbuild from "esbuild";
import { minifyTemplates, writeFiles } from "esbuild-minify-templates";

async function dev() {
    let ctx = await esbuild.context({
        entryPoints: ["src/app.js"],
        outdir: "dist",
        bundle: true,
        sourcemap: true,
    });

    await ctx.watch();

    let { host, port } = await ctx.serve({
        servedir: "dist",
        onRequest: (req) => console.log(
            `[${req.method}] ${req.path} ... status: ${req.status} ... ${req.timeInMS}ms`
        ),
    })
    console.log(`Serving at ${host}:${port}`);
}

async function prod() {
    await esbuild.build({
        plugins: [minifyTemplates({ taggedOnly: true }), writeFiles()],
        entryPoints: ["src/app.js"],
        outdir: "dist",
        bundle: true,
        minify: true,
        write: false,
    });
}

const commands = { "dev": dev, "prod": prod, };
await commands[process.argv[2]]();
