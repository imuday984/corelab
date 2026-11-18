import { ipAddress } from "@vercel/functions"; // Read the client IP.
import { // Import both functions from the generated backend module.
    handleApi, // Handle CoreLab API requests.
    getLocalEnv, // Initialize database access.
} from "../server/vercel-runtime.mjs"; // Use an explicit module filename.

export default { // Expose the entry point to Vercel.
    async fetch(request: Request): Promise<Response> { // Handle a request.
        const databaseUrl = (globalThis as typeof globalThis & {
            process?: { env?: Record<string, string | undefined> };
        }).process?.env?.DATABASE_URL;

        if (!databaseUrl) { // Require hosted PostgreSQL.
            return Response.json( // Explain missing configuration.
                { error: { message: "DATABASE_URL is missing." } }, // Message.
                { status: 503 }, // Report unavailable configuration.
            ); // Finish the error response.
        } // Finish checking database configuration.

        const url = new URL(request.url); // Read the incoming address.
        const path = url.searchParams.get("__corelab_path"); // Read routing.

        if (path !== null) { // Restore the endpoint after Vercel routing.
            url.pathname = `/api/${path}`; // Rebuild the API path.
        } // Finish restoring the endpoint.

        url.searchParams.delete("__corelab_path"); // Remove routing metadata.

        const headers = new Headers(request.headers); // Preserve cookies.
        headers.delete("cf-connecting-ip"); // Remove Cloudflare-specific input.
        headers.set("x-real-ip", ipAddress(request) || "unknown"); // Set IP.

        const forwarded = new Request(url, { // Adapt the incoming request.
            method: request.method, // Preserve its HTTP method.
            headers, // Preserve authentication and content headers.
            body: ["GET", "HEAD"].includes(request.method) // Check body use.
                ? undefined // GET and HEAD have no request body.
                : await request.arrayBuffer(), // Preserve submitted JSON.
        }); // Finish adapting the request.

        const environment = await getLocalEnv(); // Select PostgreSQL access.

        return handleApi(forwarded, { // Run the existing backend logic.
            ...environment, // Supply database and email configuration.
            DEVELOPMENT: "false", // Disable development reset-link disclosure.
        }); // Return the response, including session-cookie headers.
    }, // Finish the request handler.
}; // Finish the Vercel entry point.