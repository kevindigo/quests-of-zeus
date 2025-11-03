#!/usr/bin/env -S deno run --allow-net --allow-read

import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

const app = new Application();

// Enable CORS for development
app.use(oakCors());

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

// API routes placeholder
app.use((context) => {
  if (context.request.url.pathname.startsWith("/api/")) {
    context.response.body = { message: "API endpoint placeholder" };
    context.response.type = "application/json";
  }
});

const PORT = 8000;
console.log(`Server running on http://localhost:${PORT}`);
await app.listen({ port: PORT });