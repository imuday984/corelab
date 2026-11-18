import { build } from "esbuild"; // Use the project's existing bundler.
import { writeFile } from "node:fs/promises"; // Write type declarations.

await build({ // Package the backend and its internal imports.
    stdin: { // Define a small entry point for the bundle.
        contents: [ // Export the functions needed by Vercel.
            'export { handleApi } from "./server/api.ts";', // Include API.
            'export { getLocalEnv } from "./server/local.ts";', // Include DB.
        ].join("\n"), // Separate the export statements.
        resolveDir: process.cwd(), // Resolve paths from the project root.
        sourcefile: "vercel-runtime-entry.ts", // Label build errors.
        loader: "ts", // Read the entry as TypeScript.
    }, // Finish the entry configuration.
    outfile: "server/vercel-runtime.mjs", // Generate an explicit ESM file.
    bundle: true, // Resolve internal TypeScript and JSON imports.
    platform: "node", // Preserve Node.js built-in modules.
    format: "esm", // Match the project's module format.
    target: "node24", // Match the Vercel Node version.
    packages: "external", // Keep installed packages such as Prisma external.
}); // Finish generating the backend bundle.

await writeFile("server/vercel-runtime.d.mts", [ // Describe its exports.
    'import type { Environment } from "./db";', // Reuse the environment type.
    "export declare function handleApi(", // Begin the API declaration.
    "    request: Request,", // Accept a standard request.
    "    env: Environment,", // Accept database configuration.
    "): Promise<Response>;", // Return a standard response.
    "export declare function getLocalEnv(): Promise<Environment>;", // DB.
].join("\n") + "\n"); // Save the TypeScript declarations.

console.log("Vercel backend runtime generated."); // Confirm success.