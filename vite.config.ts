import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const isDevelopmentBuild = mode === "development";
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");

  return {
    plugins: [
      tailwindcss(),
      tanstackStart({
        importProtection: {
          behavior: "error",
          client: {
            files: ["**/server/**"],
            specifiers: ["server-only"],
          },
        },
        server: { entry: "server" },
      }),
      nitro({ defaultPreset: "cloudflare-module" }),
      react(),
    ],
    define: Object.fromEntries(
      Object.entries(loadedEnv).map(([key, value]) => [
        `import.meta.env.${key}`,
        JSON.stringify(value),
      ]),
    ),
    css: { transformer: "lightningcss" },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
      tsconfigPaths: true,
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
      ignoreOutdatedRequests: true,
    },
    server: {
      host: "::",
      port: 8080,
    },
    ...(isDevelopmentBuild
      ? {
          environments: {
            client: {
              define: {
                "process.env.NODE_ENV": JSON.stringify("development"),
              },
            },
          },
          esbuild: { keepNames: true },
        }
      : {}),
  };
});
