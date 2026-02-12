// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintpluginjsdoc from "eslint-plugin-jsdoc";

export default defineConfig(
  eslint.configs.recommended,
  {
    plugins: { jsdoc: eslintpluginjsdoc },
    rules: {
      "jsdoc/no-undefined-types": "error",
    },
  },
  tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      // exclude the transpiled js
      "packages/ts-patch-integration-test/__tests__/*",
      "demoImports/**",
    ],
  },
);
