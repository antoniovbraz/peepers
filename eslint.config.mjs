import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Temporariamente permitir 'any' para tipos de API externos
      "@typescript-eslint/no-explicit-any": "warn",
      // Permitir imports require em scripts de debug
      "@typescript-eslint/no-require-imports": "warn",
      // Permitir variáveis não utilizadas em parâmetros de função
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      // Permitir entidades HTML não escapadas em JSX
      "react/no-unescaped-entities": "warn",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Scripts de debug/test antigos - não fazem parte do código de produção
      "*.js",
      "!src/**",
      "!next.config.ts",
      "!postcss.config.mjs",
      "!vitest.config.ts",
      "!eslint.config.mjs",
    ],
  },
];

export default eslintConfig;
