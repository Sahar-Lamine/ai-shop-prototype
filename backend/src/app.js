const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", productRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

module.exports = app;