// The local Node.js entry point serves the same API through Express and supports PostgreSQL through Prisma.
import express from 'express'; // Use the preferred conventional REST server for local and self-hosted deployments.
import { resolve } from 'node:path'; // Resolve built frontend assets from the project directory.
import { handleApi } from './api'; // Share authentication, scoring, and ownership logic with the hosted Worker.
import { getLocalEnv } from './local'; // Choose PostgreSQL or the explicit local SQLite convenience adapter.
const app = express(); // Create one server with a single centralized API bridge.
const env = await getLocalEnv(); // Initialize database infrastructure before accepting any requests.
app.disable('x-powered-by'); // Avoid advertising the server implementation in response headers.
app.use('/api', express.raw({ type: () => true, limit: '64kb' })); // Preserve the raw JSON body so the portable API validates it once.
app.use('/api', async (req, res) => { // Bridge Express requests into the Fetch-standard service.
    try { // Keep transport failures distinct from application error envelopes.
        const headers = new Headers(); // Copy ordinary request headers into the portable request.
        for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value); // Preserve cookies, content type, and origin information.
        headers.set('x-real-ip', req.socket.remoteAddress || 'local'); // Override user-supplied client IP claims with the actual local socket address.
        headers.delete('cf-connecting-ip'); // Trust Cloudflare's address header only in the real Worker runtime.
        const origin = env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`; // Honor the configured browser-facing HTTPS origin behind a production reverse proxy.
        const request = new Request(new URL(req.originalUrl, origin), { method: req.method, headers, ...(!['GET', 'HEAD'].includes(req.method) ? { body: req.body?.length ? req.body : '{}' } : {}) }); // Adapt the original URL and raw body without accepting a user ID.
        const response = await handleApi(request, env); // Apply the same validation and authorization as production Sites.
        res.status(response.status); // Preserve controlled HTTP status codes.
        response.headers.forEach((value, key) => res.setHeader(key, value)); // Preserve HttpOnly session cookies and cache protections.
        res.send(Buffer.from(await response.arrayBuffer())); // Return the exact JSON response body.
    } catch { // Convert transport-level failures into a stable server response.
        res.status(500).json({ error: { code: 'TRANSPORT_ERROR', message: 'The API transport failed. Please try again.' } }); // Avoid exposing stack traces or connection strings.
    } // Finish Express transport error handling.
}); // Finish API routing.
app.use(express.static(resolve(process.cwd(), 'dist/client'))); // Serve the built React frontend for a complete local production deployment.
app.use((req, res) => { // Route client-side pages back to the React application.
    if (req.method === 'GET' && !req.path.startsWith('/api')) res.sendFile(resolve(process.cwd(), 'dist/client/index.html')); // Support deep links through React Router.
    else res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }); // Preserve an honest missing-route response for unsupported requests.
}); // Finish frontend fallback handling.
app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`CS Fundamentals server listening on port ${process.env.PORT || 3000}`)); // Start after the database is ready without printing secrets.
