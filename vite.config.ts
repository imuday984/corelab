import { defineConfig } from "vite"; // Configure the frontend development and production build.
import react from "@vitejs/plugin-react"; // Transform accessible React components and enable fast refresh.
import tailwind from "@tailwindcss/vite"; // Compile the utility stylesheet through Tailwind.
export default defineConfig({ // Continue this clearly scoped calculation or control declaration.
    // Keep build configuration separate from product code.
    plugins: [ // Define this field in the shared component or request contract.
        react(), // Continue this clearly scoped calculation or control declaration.
        tailwind(), // Continue this clearly scoped calculation or control declaration.
        { // Render this expression using the current application state.
            // Add the local API alongside the frontend during development.
            name: "corelab-local-api", // Identify this small development adapter in Vite diagnostics.
            async configureServer(server) { // Continue this clearly scoped calculation or control declaration.
                // Attach only the application's REST API routes.
                const { getLocalEnv } = await import("./server/local"); // Initialize local schema before accepting requests.
                const environment = await getLocalEnv(); // Reuse one initialized connection.
                server.middlewares.use("/api", async (req, res) => { // Continue this clearly scoped calculation or control declaration.
                    // Keep all API requests on the same origin as cookies.
                    try { // Run the operation while preserving a recoverable error path.
                        // Return a useful JSON error when the local database cannot start.
                        const { handleApi } = await import("./server/api"); // Load the same portable API used in production.
                        // The environment was initialized when the development server started.
                        const chunks: Buffer[] = []; // Collect a bounded request body before converting to Fetch.
                        for await (const chunk of req) { // Continue this clearly scoped calculation or control declaration.
                            chunks.push(Buffer.from(chunk)); // Continue this clearly scoped calculation or control declaration.
                        } // Preserve the JSON request body.
                        const host = req.headers.host || "localhost:4173"; // Build the development origin from the active server.
                        const headers = new Headers(); // Translate Node request headers into standard Fetch headers.
                        for (const [key, value] of Object.entries(req.headers)) { // Continue this clearly scoped calculation or control declaration.
                            if (value) headers.set(key, Array.isArray(value) ? value.join(",") : value); // Handle this condition before continuing the normal flow.
                        } // Preserve cookies and content type.
                        const origin = // Calculate or retain this value for the current render.
                            req.headers.origin && new URL(req.headers.origin).host === host // Continue this clearly scoped calculation or control declaration.
                                ? req.headers.origin // Choose the content appropriate to the current state.
                                : `${req.headers["x-forwarded-proto"] || "http"}://${host}`; // Preserve the browser's same-origin transport during managed preview.
                        const request = new Request(`${origin}/api${req.url}`, { // Calculate or retain this value for the current render.
                            method: req.method, // Define this field in the shared component or request contract.
                            headers, // Continue this clearly scoped calculation or control declaration.
                            body: ["GET", "HEAD"].includes(req.method || "GET") // Define this field in the shared component or request contract.
                                ? undefined // Choose the content appropriate to the current state.
                                : Buffer.concat(chunks), // Choose the content appropriate to the current state.
                        }); // Adapt Node to the portable API.
                        const result = await handleApi(request, environment); // Execute real database-backed request handling.
                        res.statusCode = result.status; // Preserve the API's HTTP status.
                        result.headers.forEach((value, key) => res.setHeader(key, value)); // Preserve HttpOnly session cookies.
                        res.end(Buffer.from(await result.arrayBuffer())); // Send the API response to the browser.
                    } catch (error) { // Finish this expression or rendered group.
                        // Keep failed initialization from crashing the development server.
                        res.statusCode = 500; // Tell the client that the request could not complete.
                        res.setHeader("Content-Type", "application/json"); // Keep the error response machine-readable.
                        res.end( // Continue this clearly scoped calculation or control declaration.
                            JSON.stringify({ // Continue this clearly scoped calculation or control declaration.
                                error: { // Define this field in the shared component or request contract.
                                    message: // Define this field in the shared component or request contract.
                                        error instanceof Error // Continue this clearly scoped calculation or control declaration.
                                            ? error.message // Choose the content appropriate to the current state.
                                            : "Unable to start the local API.", // Choose the content appropriate to the current state.
                                }, // Finish the current expression or code block.
                            }), // Finish the current expression or code block.
                        ); // Surface actionable development feedback.
                    } // Finish request error handling.
                }); // Finish installing API middleware.
            }, // Finish the development server hook.
        }, // Finish the current expression or code block.
    ], // Finish the plugin list.
    build: { outDir: "dist/client" }, // Keep client assets separate from the hosted Worker entrypoint.
}); // Export the complete Vite configuration.
