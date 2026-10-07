import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  outputFileTracingIncludes: {
    "/api/studio/assist": ["src/lib/studio/skills/library/*/SKILL.md"],
    "/api/studio/skills/run": ["src/lib/studio/skills/library/*/SKILL.md"],
  },
  turbopack: { root: process.cwd() },
  serverExternalPackages: ['sequelize', 'sqlite3']
};

export default nextConfig;
