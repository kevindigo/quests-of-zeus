#!/usr/bin/env -S deno run --allow-net --allow-read

// Oracle of Delphi Game Server
// Serves the playable game interface

import { Application, Router } from "@oak/oak";

const app = new Application();
const router = new Router();

// Game routes
router
  .get("/", (context) => {
    context.response.redirect("/index.html");
  })
  .get("/game", (context) => {
    context.response.redirect("/index.html");
  });

app.use(router.routes());
app.use(router.allowedMethods());

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

// Error handling
app.use((context) => {
  context.response.status = 404;
  context.response.body = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Oracle of Delphi - Not Found</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 2rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
          h1 { font-size: 3rem; margin-bottom: 1rem; }
          a { color: white; text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>404 - Not Found</h1>
        <p>The requested resource was not found.</p>
        <p><a href="/">Return to Oracle of Delphi</a></p>
      </body>
    </html>
  `;
});

const PORT = 8000;
console.log(`🚀 Oracle of Delphi Game Server running on http://localhost:${PORT}`);
console.log(`🎮 Play the game at http://localhost:${PORT}/game`);
console.log(`🗺️ Map generation and game mechanics are fully functional`);

await app.listen({ port: PORT });