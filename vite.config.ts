import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    platform: "node",
    target: "es2022",
    fixedExtension: false,
    dts: true,
    publint: true,
  },
  // Matches the existing code style; the repo has no formatter check.
  fmt: {
    ignorePatterns: ["dist/**"],
    trailingComma: "es5",
    sortPackageJson: false,
  },
  lint: {
    ignorePatterns: ["dist/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
});
