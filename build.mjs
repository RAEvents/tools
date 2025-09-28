import esbuild from "esbuild";

async function build() {
    return await esbuild.context({
        entryPoints: ["src/app.jsx"],
        outdir: "dist",
        bundle: true,
        // minify: true,
        sourcemap: true,
        format: "esm",
        jsx: "automatic",
        jsxImportSource: "preact",
    });
}

async function serve(ctx) {
    await ctx.watch();

    let { hosts, port } = await ctx.serve({
        servedir: "dist",
        onRequest: r => console.log(`${r.method} ${r.path} ${r.status}`),
    });

    console.log(`Serving at ${hosts[0]}:${port}`);
}

const ctx = await build();

if (process.argv[2] === "--serve") {
    await serve(ctx);
} else {
    ctx.dispose();
}

