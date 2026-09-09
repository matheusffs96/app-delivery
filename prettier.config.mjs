/** @type {import("prettier").Config} */
const config = {
    semi: true,
    singleQuote: false,
    trailingComma: "es5",
    tabWidth: 4,
    useTabs: false,
    printWidth: 100,
    endOfLine: "lf",
    plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
