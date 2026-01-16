/**
 * Generate JWT keys for Convex Auth
 *
 * Run with: node tools/generateAuthKeys.mjs
 *
 * Then add the output to your Convex dashboard:
 * Dashboard → Settings → Environment Variables
 *
 * Required variables:
 * - JWT_PRIVATE_KEY
 * - JWKS
 * - SITE_URL (your production URL)
 */

import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const keys = await generateKeyPair("RS256");
const privateKey = await exportPKCS8(keys.privateKey);
const publicKey = await exportJWK(keys.publicKey);
const jwks = JSON.stringify({ keys: [{ use: "sig", ...publicKey }] });

console.log("=".repeat(60));
console.log("JWT_PRIVATE_KEY:");
console.log("=".repeat(60));
console.log(privateKey);
console.log("\n" + "=".repeat(60));
console.log("JWKS:");
console.log("=".repeat(60));
console.log(jwks);
console.log("\n" + "=".repeat(60));
console.log("Instructions:");
console.log("=".repeat(60));
console.log("1. Go to https://dashboard.convex.dev");
console.log("2. Select your project → Settings → Environment Variables");
console.log("3. Add JWT_PRIVATE_KEY with the private key above");
console.log("4. Add JWKS with the JSON above");
console.log("5. Add SITE_URL with your production URL (e.g., https://murmura.renner.dev)");
