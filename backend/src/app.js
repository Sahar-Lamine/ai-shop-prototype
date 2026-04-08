const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const { handleMcp } = require("./mcp/handler");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ai-shop-prototype.vercel.app"
  ]
}));

app.use(express.json());

app.use("/api", productRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Endpoint MCP public pour ChatGPT
app.all("/mcp", handleMcp);

module.exports = app;