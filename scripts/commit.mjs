import { execFileSync } from "node:child_process";

const message = process.argv.slice(2).join(" ").trim();

if (!message) {
    console.error('Informe a mensagem. Ex: npm run commit -- "feat: minha alteração"');
    process.exit(1);
}

execFileSync("git", ["add", "."], {
    stdio: "inherit",
});

execFileSync("git", ["commit", "-m", message], {
    stdio: "inherit",
});

execFileSync("git", ["push"], {
    stdio: "inherit",
});
