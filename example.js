import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

import { init } from "@heyputer/puter.js/src/init.cjs";

const puter = init(process.env.PUTER_AUTH_TOKEN);

async function chatExample() {
  const response = await puter.ai.chat([{role:'user', content:'Hello, how are you?'}], {
    model: "deepseek-chat",
    stream: false
  });
  console.log(JSON.stringify(response, null, 2).substring(0, 500));
}

async function streamExample() {
  const stream = await puter.ai.chat([{role:'user', content:'Tell me a story'}], {
    model: "deepseek-chat",
    stream: true
  });
  
  for await (const part of stream) {
    process.stdout.write(part?.message?.content || part?.text || "");
  }
  console.log("\n");
}

chatExample();
