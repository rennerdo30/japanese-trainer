#!/usr/bin/env node
/**
 * Generate JWT keys for Convex Auth
 *
 * Usage:
 *   node tools/generateAuthKeys.mjs              # Just display keys
 *   node tools/generateAuthKeys.mjs --deploy     # Generate and set in Convex (dev)
 *   node tools/generateAuthKeys.mjs --deploy --prod  # Generate and set in Convex (prod)
 *
 * Required variables set:
 * - JWT_PRIVATE_KEY
 * - JWKS
 * - SITE_URL (only with --prod flag)
 */

import { exportJWK, exportPKCS8, generateKeyPair } from "jose";
import { execSync } from "child_process";

const args = process.argv.slice(2);
const shouldDeploy = args.includes("--deploy");
const isProd = args.includes("--prod");

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

if (shouldDeploy) {
  console.log(`\nDeploying to Convex (${isProd ? "production" : "development"})...`);

  const prodFlag = isProd ? " --prod" : "";

  try {
    // Set JWT_PRIVATE_KEY - use stdin to handle multi-line value
    console.log("\nSetting JWT_PRIVATE_KEY...");
    execSync(`npx convex env set JWT_PRIVATE_KEY${prodFlag} -- '${privateKey.replace(/'/g, "'\\''")}'`, {
      stdio: "inherit",
      shell: true
    });

    // Set JWKS
    console.log("\nSetting JWKS...");
    execSync(`npx convex env set JWKS${prodFlag} '${jwks}'`, {
      stdio: "inherit",
      shell: true
    });

    // Set SITE_URL for production
    if (isProd) {
      console.log("\nSetting SITE_URL...");
      execSync(`npx convex env set SITE_URL${prodFlag} 'https://murmura.renner.dev'`, {
        stdio: "inherit",
        shell: true
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Environment variables set successfully!");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("\n❌ Failed to set environment variables via CLI.");
    console.error("This may be due to multi-line value issues or missing authentication.");
    console.error("\nPlease set them manually in the Convex Dashboard:");
    console.error("https://dashboard.convex.dev → Settings → Environment Variables");
    process.exit(1);
  }
} else {
  console.log("Instructions:");
  console.log("=".repeat(60));
  console.log("Option 1: Run with --deploy flag to set automatically:");
  console.log("  node tools/generateAuthKeys.mjs --deploy        # dev");
  console.log("  node tools/generateAuthKeys.mjs --deploy --prod # production");
  console.log("");
  console.log("Option 2: Set manually in Convex Dashboard:");
  console.log("  1. Go to https://dashboard.convex.dev");
  console.log("  2. Select your project → Settings → Environment Variables");
  console.log("  3. Add JWT_PRIVATE_KEY with the private key above");
  console.log("  4. Add JWKS with the JSON above");
  console.log("  5. Add SITE_URL with your production URL (e.g., https://murmura.renner.dev)");
}
