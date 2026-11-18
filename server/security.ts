// Authentication primitives use WebCrypto so the same implementation runs in Node and Workers.
const encoder = new TextEncoder(); // Encode passwords and random tokens consistently as UTF-8.
const hex = (bytes: Uint8Array): string => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(''); // Serialize binary values without logging them.
const unhex = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(value.match(/.{2}/g) || [], byte => parseInt(byte, 16)); // Decode the stored salt and derived key.
export const token = (): string => hex(crypto.getRandomValues(new Uint8Array(32))); // Generate an unpredictable 256-bit session or reset token.
export const digest = async (value: string): Promise<string> => hex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))); // Store only a hash of bearer credentials.
export async function hashPassword(password: string, salt = token()): Promise<string> { // Derive a salted password hash rather than storing a password.
    const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']); // Import the password into WebCrypto.
    const result = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unhex(salt), iterations: 100000, hash: 'SHA-256' }, material, 256); // Spend deliberate CPU time on offline guessing resistance.
    return `pbkdf2-sha256$100000$${salt}$${hex(new Uint8Array(result))}`; // Keep the version and work factor alongside the hash.
} // Finish password derivation.
export async function verifyPassword(password: string, stored: string): Promise<boolean> { // Verify without exposing the stored hash.
    const parts = stored.split('$'); // Read the versioned password-hash fields.
    if (parts.length !== 4 || parts[0] !== 'pbkdf2-sha256' || parts[1] !== '100000') return false; // Reject malformed or unsupported stored hashes.
    const candidate = await hashPassword(password, parts[2]); // Derive the submitted password using the original salt.
    const a = encoder.encode(candidate); // Encode the derived representation.
    const b = encoder.encode(stored); // Encode the stored representation.
    let difference = a.length ^ b.length; // Include a length mismatch in the comparison.
    for (let index = 0; index < Math.max(a.length, b.length); index += 1) difference |= (a[index] || 0) ^ (b[index] || 0); // Compare every byte without an early mismatch return.
    return difference === 0; // Accept only identical representations.
} // Finish password verification.
export function sessionCookie(value: string, request: Request, clear = false): string { // Keep the session inaccessible to browser JavaScript.
    const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''; // Require secure transport in hosted HTTPS environments.
    return `cs_session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear ? 0 : 60 * 60 * 24 * 30}${secure}`; // Persist sessions for thirty days and clear them explicitly on logout.
} // Finish cookie construction.
export function readSession(request: Request): string | null { // Read only the application's session cookie.
    return request.headers.get('cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith('cs_session='))?.slice(11) || null; // Avoid accepting identities from request bodies.
} // Finish cookie parsing.
