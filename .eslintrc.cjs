module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
        es2021: true
    },
    extends: ['eslint:recommended', 'plugin:prettier/recommended'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
    },
    rules: {
        'no-console': 'off'
    },
    overrides: [
        {
            files: ['src/main/**/*.js'],
            env: {
                node: true
            }
        },
        {
            files: ['src/renderer/**/*.js'],
            env: {
                browser: true
            },
            globals: {
                html2canvas: 'readonly'
            }
        }
    ]
};
