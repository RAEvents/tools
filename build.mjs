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
        fallback: "dist/404.html",
        onRequest: r => console.log(`${r.method} ${r.path} ${r.status}`),
    });

    console.log(`Serving at ${hosts[0]}:${port}`);
}

const ctx = await build();

switch (process.argv[2]) {
    case "--serve":
        await serve(ctx);
        break;
    case "--watch":
        await ctx.watch();
        break;
    default:
        ctx.dispose();
        break;
}
