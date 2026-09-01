/**
 * Cloudflare Worker entry: serves the static site from ./site (assets binding) and handles POST /api/lead.
 * Config: wrangler.jsonc · Deploy: `npx wrangler deploy` (Workers Builds runs this on every push to main).
 */
import { handleLead } from "./lead.js";

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/lead") return handleLead(request, env);
    return env.ASSETS.fetch(request);
  },
};
