// ESLint (D1): TypeScript, React-Hooks und Barrierefreiheit. Läuft in der CI bei jedem PR (npm run lint).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default tseslint.config(
  { ignores: ["dist/**", "dist-single/**", "dist-einzel/**", "node_modules/**", "public/vendor/**", "public/wfpdf/**", "public/sbkim/**", "public/native/native-network.js", "public/native/installieren.js", "public/native/25_pseudonym.js", "android/**", "windows/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks, "jsx-a11y": jsxA11y },
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      // Steuerzeichen in Mustern sind Absicht: sie säubern Dateinamen und erkennen Binärinhalt (local-vault, family-assignment).
      "no-control-regex": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_", ignoreRestSiblings: true }],
      // Die eigenen Diktatfelder sind Formularelemente; das Muster <label><span>…</span><VoiceInput/></label> ist korrekt.
      "jsx-a11y/label-has-associated-control": ["error", { assert: "either", controlComponents: ["VoiceInput", "VoiceTextarea", "DictationButton"], depth: 3 }],
      // Berühren das Aussehen bzw. die Bedienung der Oberfläche des Freundes (Abschnitt F): nur Warnung, Änderung erst nach Klaus’ Ja.
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/no-autofocus": "warn",
    },
  },
  { files: ["**/*.{js,mjs}"], languageOptions: { globals: { ...globals.browser, ...globals.node, ...globals.serviceworker } } },
);
