import js from "@eslint/js";
import globals from "globals";

export default [
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "Noise/**",
            // Unused stub left in tree
            "Assets/entities/baseEntity.js",
        ],
    },
    js.configs.recommended,
    {
        files: ["**/*.js"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            // Primary goal: catch missing imports / leftover ambient globals
            "no-undef": "error",
            // Pre-existing noise in this codebase — keep lint focused
            "no-unused-vars": "off",
            "no-empty": "off",
            "no-prototype-builtins": "off",
            "no-case-declarations": "off",
            "no-fallthrough": "off",
            "no-useless-escape": "off",
            "no-constant-binary-expression": "off",
            "no-cond-assign": "off",
            "no-sparse-arrays": "off",
            "no-dupe-keys": "off",
            "no-constant-condition": "off",
            "no-useless-assignment": "off",
        },
    },
    {
        files: ["vite.config.js", "eslint.config.js"],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
];
