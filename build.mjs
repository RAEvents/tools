import esbuild from "esbuild";

async function build() {
    return await esbuild.context({
        entryPoints: ["src/app.js", "src/index.html"],
        outdir: "build",
        bundle: true,
        minify: true,
        sourcemap: true,
        format: "esm",
        loader: { ".html": "copy" },
    });
}

async function serve(ctx) {
    await ctx.watch();

    let { host, port } = await ctx.serve({
        servedir: "build",
        onRequest: r => console.log(`${r.method} ${r.path} ${r.status}`),
    });

    console.log(`Serving at ${host}:${port}`);
}

const ctx = await build();
if (process.argv[2] === "--serve") {
    await serve(ctx);
} else {
    ctx.dispose();
}

