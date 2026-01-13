// Generate JWT keys for Convex Auth
// Run with: node tools/generate-jwt-keys.js

import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

async function generateKeys() {
  try {
    const keys = await generateKeyPair("RS256");
    const privateKey = await exportPKCS8(keys.privateKey);
    const publicKey = await exportJWK(keys.publicKey);
    const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });
    return {
      JWT_PRIVATE_KEY: `${privateKey.trimEnd().replace(/\n/g, " ")}`,
      JWKS: jwks,
    };
  } catch (error) {
    console.error("Could not generate private and public key:", error);
    process.exit(1);
  }
}

const keys = await generateKeys();
console.log("\n=== JWT Keys Generated ===\n");
console.log("JWT_PRIVATE_KEY:");
console.log(keys.JWT_PRIVATE_KEY);
console.log("\nJWKS:");
console.log(keys.JWKS);
console.log("\n=== Set these in Convex ===");
console.log("Run these commands:");
console.log(`npx convex env set JWT_PRIVATE_KEY "${keys.JWT_PRIVATE_KEY}"`);
console.log(`npx convex env set JWKS '${keys.JWKS}'`);
