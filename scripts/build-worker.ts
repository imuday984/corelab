import { readdir, readFile, mkdir, copyFile, writeFile } from "node:fs/promises"; // Read verified build output and write a self-contained deployment.
import { join, relative } from "node:path"; // Resolve asset paths without hardcoded platform separators.
import { build } from "esbuild"; // Bundle portable TypeScript into one Worker ES module.
const clientDirectory = "dist/client"; // Read only the frontend build output.
const assets: Record<string, { body: string; type: string }> = {}; // Collect immutable deployable assets.
const mime: Record<string, string> = { // Calculate or retain this value for the current render.
    ".html": "text/html; charset=utf-8", // Continue this clearly scoped calculation or control declaration.
    ".js": "text/javascript; charset=utf-8", // Continue this clearly scoped calculation or control declaration.
    ".css": "text/css; charset=utf-8", // Continue this clearly scoped calculation or control declaration.
    ".svg": "image/svg+xml", // Continue this clearly scoped calculation or control declaration.
    ".woff2": "font/woff2", // Continue this clearly scoped calculation or control declaration.
    ".png": "image/png", // Continue this clearly scoped calculation or control declaration.
    ".ico": "image/x-icon", // Continue this clearly scoped calculation or control declaration.
}; // Declare correct browser content types.
async function collect(directory: string): Promise<void> { // Continue this clearly scoped calculation or control declaration.
    // Walk only the public client asset tree.
    for (const entry of await readdir(directory, { withFileTypes: true })) { // Continue this clearly scoped calculation or control declaration.
        // Inspect files and nested asset directories.
        const path = join(directory, entry.name); // Resolve the asset's full local path.
        if (entry.isDirectory()) { // Handle this condition before continuing the normal flow.
            await collect(path); // Wait for this data operation before continuing.
            continue; // Continue this clearly scoped calculation or control declaration.
        } // Visit nested Vite output recursively.
        const extension = "." + entry.name.split(".").at(-1); // Select the asset's media type.
        assets["/" + relative(clientDirectory, path).replaceAll("\\", "/")] = { // Continue this clearly scoped calculation or control declaration.
            body: (await readFile(path)).toString("base64"), // Define this field in the shared component or request contract.
            type: mime[extension] || "application/octet-stream", // Define this field in the shared component or request contract.
        }; // Embed binary-safe bytes under the public route.
    } // Finish collecting this directory.
} // Finish recursive asset collection.
await collect(clientDirectory); // Finish the asset table before bundling the Worker.
await mkdir("dist/server", { recursive: true }); // Keep the hosted Worker in the supported deployment location.
await mkdir("dist/.openai", { recursive: true }); // Include the exact Site identity in the artifact.
await build({ // Wait for this data operation before continuing.
    entryPoints: ["server/worker.ts"], // Define this field in the shared component or request contract.
    outfile: "dist/server/index.js", // Define this field in the shared component or request contract.
    bundle: true, // Define this field in the shared component or request contract.
    format: "esm", // Define this field in the shared component or request contract.
    platform: "browser", // Define this field in the shared component or request contract.
    target: "es2022", // Define this field in the shared component or request contract.
    minify: true, // Define this field in the shared component or request contract.
    define: { __CORELAB_ASSETS__: JSON.stringify(assets) }, // Define this field in the shared component or request contract.
}); // Produce one module with no Node or filesystem runtime dependencies.
await copyFile(".openai/hosting.json", "dist/.openai/hosting.json"); // Package the same verified hosting manifest as the source.
await writeFile( // Wait for this data operation before continuing.
    "dist/server/wrangler.json", // Continue this clearly scoped calculation or control declaration.
    JSON.stringify( // Continue this clearly scoped calculation or control declaration.
        { // Render this expression using the current application state.
            name: "corelab", // Define this field in the shared component or request contract.
            main: "index.js", // Define this field in the shared component or request contract.
            compatibility_date: "2026-01-01", // Define this field in the shared component or request contract.
            d1_databases: [{ binding: "DB", database_name: "corelab", migrations_dir: "../../drizzle" }], // Define this field in the shared component or request contract.
        }, // Finish the current expression or code block.
        null, // Continue this clearly scoped calculation or control declaration.
        2, // Continue this clearly scoped calculation or control declaration.
    ), // Finish the current expression or code block.
); // Describe the D1 binding and schema migrations for hosted provisioning.
console.log(`Built CoreLab Worker with ${Object.keys(assets).length} client assets.`); // Report a concise, credential-free build result.
