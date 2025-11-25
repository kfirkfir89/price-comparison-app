/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
const config = {
    trailingComma: 'es5',
    tabWidth: 4,
    semi: false,
    singleQuote: true,
    tailwindConfig: './tailwind.config.js',
    tailwindFunctions: ['clsx', 'cs'],
    tailwindPreserveDuplicates: true,
    tailwindPreserveWhitespace: true,
    plugins: ['prettier-plugin-tailwindcss'],
}

export default config
