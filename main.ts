#!/usr/bin/env -S deno run --allow-net --allow-read

// This file is now a simple static file server for development
// In production, this would be replaced by a proper static file server

import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";

const app = new Application();

// Static file serving
app.use(async (context, next) => {
  try {
    await context.send({
      root: Deno.cwd(),
      index: "index.html",
    });
  } catch {
    await next();
  }
});

const PORT = 8000;
console.log(`Static file server running on http://localhost:${PORT}`);
console.log(`The game is now entirely client-side!`);
await app.listen({ port: PORT });
