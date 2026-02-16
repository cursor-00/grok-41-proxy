import { init } from "@heyputer/puter.js/src/init.cjs";
import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '.env') });

// SDK expects 'puterAuthToken' env var
const authToken = process.env.PUTER_AUTH_TOKEN || process.env.puterAuthToken;
console.log("client.js loaded - authToken exists:", !!authToken);

const puter = init(authToken);

export default puter;
