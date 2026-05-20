import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** ISO date of the latest commit on the upstream branch, else HEAD. */
function getLastUpdatedFromGit() {
  try {
    const upstream = execSync("git rev-parse --abbrev-ref @{u}", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (upstream) {
      return execSync(`git log -1 --format=%cI ${upstream}`, { encoding: "utf8" }).trim();
    }
  } catch {
    /* no upstream */
  }
  try {
    return execSync("git log -1 --format=%cI HEAD", { encoding: "utf8" }).trim();
  } catch {
    return new Date().toISOString();
  }
}

const lastUpdatedIso = getLastUpdatedFromGit();

export default defineConfig({
  plugins: [react()],
  define: {
    __LAST_UPDATED__: JSON.stringify(lastUpdatedIso),
  },
});
