import { handleApi } from "./api"; // Share the complete REST service with the local Express application.
import type { Environment } from "./db"; // Read the D1 binding through the common runtime contract.
declare const __CORELAB_ASSETS__: Record<string, { body: string; type: string }>; // Let the build inject the exact Vite output without filesystem access in Workers.
export default { // Continue this clearly scoped calculation or control declaration.
    // Export the standard Cloudflare Worker request handler.
    async fetch(request: Request, env: Environment): Promise<Response> { // Continue this clearly scoped calculation or control declaration.
        // Handle assets and APIs on one secure origin.
        const url = new URL(request.url); // Resolve the requested route without trusting client-supplied ownership.
        if (url.pathname.startsWith("/api/")) return handleApi(request, env); // Send all private actions through authentication and validation.
        if (!["GET", "HEAD"].includes(request.method)) // Handle this condition before continuing the normal flow.
            return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } }); // Restrict non-API routes to document and asset reads.
        const assets = __CORELAB_ASSETS__; // Use the immutable asset table packaged with this source version.
        const asset = // Calculate or retain this value for the current render.
            assets[url.pathname] || // Continue this clearly scoped calculation or control declaration.
            (!url.pathname.split("/").at(-1)?.includes(".") ? assets["/index.html"] : undefined); // Let React Router own document routes while keeping missing files as 404s.
        if (!asset) return new Response("Asset not found", { status: 404 }); // Return a truthful error for missing files.
        const bytes = Uint8Array.from(atob(asset.body), (character) => character.charCodeAt(0)); // Decode the generated UTF-8 or binary asset safely.
        const headers = { // Calculate or retain this value for the current render.
            "Content-Type": asset.type, // Continue this clearly scoped calculation or control declaration.
            "Cache-Control": url.pathname.startsWith("/assets/") // Continue this clearly scoped calculation or control declaration.
                ? "public, max-age=31536000, immutable" // Choose the content appropriate to the current state.
                : "no-cache", // Choose the content appropriate to the current state.
            "X-Content-Type-Options": "nosniff", // Continue this clearly scoped calculation or control declaration.
            "Referrer-Policy": "strict-origin-when-cross-origin", // Continue this clearly scoped calculation or control declaration.
            "Content-Security-Policy": // Continue this clearly scoped calculation or control declaration.
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com; form-action 'self'",
        }; // Apply useful browser protections while allowing accessible inline layout styles.
        return new Response(request.method === "HEAD" ? null : bytes, { headers }); // Serve the exact assets produced by the verified frontend build.
    }, // Finish the Fetch handler.
}; // Finish the Worker module.
