#!/usr/bin/env -S deno run --allow-net --allow-read

import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { HexMap } from "./hexmap.ts";

const app = new Application();
const router = new Router();

// Create a game map instance
const gameMap = new HexMap();

// Enable CORS for development
app.use(oakCors());

// API routes
router
  .get("/api/map", (context) => {
    context.response.body = {
      map: gameMap.serialize(),
      dimensions: {
        width: gameMap.width,
        height: gameMap.height
      }
    };
    context.response.type = "application/json";
  })
  .get("/api/map/cell/:q/:r", (context) => {
    const q = parseInt(context.params.q);
    const r = parseInt(context.params.r);
    
    const cell = gameMap.getCell(q, r);
    if (cell) {
      context.response.body = { cell };
    } else {
      context.response.status = 404;
      context.response.body = { error: "Cell not found" };
    }
    context.response.type = "application/json";
  })
  .get("/api/map/terrain/:terrain", (context) => {
    const terrain = context.params.terrain;
    const cells = gameMap.getCellsByTerrain(terrain as any);
    context.response.body = { cells };
    context.response.type = "application/json";
  })
  .get("/api/map/special", (context) => {
    const specialCells = gameMap.getSpecialCells();
    context.response.body = { specialCells };
    context.response.type = "application/json";
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

const PORT = 8000;
console.log(`Server running on http://localhost:${PORT}`);
console.log(`Map API available at http://localhost:${PORT}/api/map`);
await app.listen({ port: PORT });