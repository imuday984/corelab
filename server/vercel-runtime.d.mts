import type { Environment } from "./db";
export declare function handleApi(
    request: Request,
    env: Environment,
): Promise<Response>;
export declare function getLocalEnv(): Promise<Environment>;
