/** @type {import("prettier").Config} */
const config = {
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    printWidth: 100,
    endOfLine: 'lf',

    // Plugins for enhanced formatting
    plugins: ['prettier-plugin-packagejson', '@ianvs/prettier-plugin-sort-imports'],

    // Import sorting configuration
    importOrder: [
        '^react$',
        '^react-dom$',
        '',
        '<THIRD_PARTY_MODULES>',
        '',
        '^@repo/(.*)$',
        '',
        '^@/(.*)$',
        '^[./]',
    ],
    importOrderTypeScriptVersion: '5.9.3',
};

export default config;