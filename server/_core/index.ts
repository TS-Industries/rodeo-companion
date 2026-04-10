import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { createVideoUploadRouter } from "../videoUpload";
import { createReceiptUploadRouter } from "../receiptUpload";
import bcrypt from "bcryptjs";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error("No available port found starting from " + startPort);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password and name required" });
      }
      const existing = await db.getUserByEmail(email);
      if (existing) return res.status(409).json({ error: "Email already registered" });
      const hash = await bcrypt.hash(password, 10);
      const openId = "local_" + Date.now() + "_" + Math.random().toString(36).slice(2);
      await db.upsertUser({ openId, email, name, passwordHash: hash, loginMethod: "email", lastSignedIn: new Date() });
      const user = await db.getUserByOpenId(openId);
      const token = await sdk.createSessionToken(openId, { name });
      res.cookie(COOKIE_NAME, token, getSessionCookieOptions(req));
      res.json({ success: true, user });
    } catch (e) {
      console.error("[Auth] Register error:", e);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password required" });
      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) return res.status(401).json({ error: "Invalid email or password" });
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: "Invalid email or password" });
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
      res.cookie(COOKIE_NAME, token, getSessionCookieOptions(req));
      res.json({ success: true, user });
    } catch (e) {
      console.error("[Auth] Login error:", e);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.use(createVideoUploadRouter());
  app.use(createReceiptUploadRouter());

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log("Port " + preferredPort + " is busy, using port " + port + " instead");
  }
  server.listen(port, () => {
    console.log("Server running on http://localhost:" + port + "/");
  });
}

startServer().catch(console.error);
