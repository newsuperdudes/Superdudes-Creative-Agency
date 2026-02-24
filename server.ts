import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_FILE = path.join(__dirname, "assets.json");

// Initialize assets file if it doesn't exist
if (!fs.existsSync(ASSETS_FILE)) {
  fs.writeFileSync(ASSETS_FILE, JSON.stringify({}));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: "50mb" }));

  // API Routes
  app.get("/api/assets", (req, res) => {
    try {
      const data = fs.readFileSync(ASSETS_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      res.status(500).json({ error: "Failed to read assets" });
    }
  });

  app.post("/api/assets", (req, res) => {
    try {
      const { key, value } = req.body;
      const data = JSON.parse(fs.readFileSync(ASSETS_FILE, "utf-8"));
      if (value === null) {
        delete data[key];
      } else {
        data[key] = value;
      }
      fs.writeFileSync(ASSETS_FILE, JSON.stringify(data, null, 2));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save asset" });
    }
  });

  app.post("/api/assets/clear", (req, res) => {
    try {
      fs.writeFileSync(ASSETS_FILE, JSON.stringify({}));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear assets" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
