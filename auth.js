import puter from "@heyputer/puter.js";

async function run() {
  console.log("Opening browser for Puter login...");
  
  await puter.auth.signIn();

  const user = await puter.auth.getUser();
  console.log("\nSigned in as:", user);

  console.log("\nAuth token:");
  console.log(puter.auth.authToken);
}

run();
