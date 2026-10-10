import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { parse } from "dotenv";

const variables = parse(readFileSync(".env.production.local"));

const databaseUrl = variables.PRODUCTION_DATABASE_URL;

if (!databaseUrl) {
    throw new Error("PRODUCTION_DATABASE_URL não configurada.");
}

const target = new URL(databaseUrl);

console.log("Destino da migration:");
console.log(`Host: ${target.hostname}`);
console.log(`Banco: ${target.pathname.slice(1)}`);

if (!target.hostname.includes("supabase.com")) {
    throw new Error("O destino não parece ser um banco Supabase.");
}

if (!process.argv.includes("--confirm")) {
    console.log("\nNenhuma alteração realizada. Execute novamente com --confirm.");
    process.exit(0);
}

execFileSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy", "--config", "prisma7.config.ts"],
    {
        stdio: "inherit",
        env: {
            ...process.env,
            DATABASE_URL: databaseUrl,
        },
    }
);
