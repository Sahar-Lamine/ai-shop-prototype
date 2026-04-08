const http = require("http");
const url = require("url");
const productService = require("../services/productService");

const PORT = 4100;

function sendJson(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === "GET" && parsedUrl.pathname === "/health") {
    return sendJson(res, 200, { ok: true, service: "mcp-mock" });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/tools/search_products") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      const parsed = body ? JSON.parse(body) : {};
      const query = parsed.query || "";
      const results = productService.searchProducts(query);

      sendJson(res, 200, {
        tool: "search_products",
        input: { query },
        output: results
      });
    });

    return;
  }

  if (req.method === "POST" && parsedUrl.pathname === "/tools/list_products") {
    return sendJson(res, 200, {
      tool: "list_products",
      output: productService.getAllProducts()
    });
  }

  if (req.method === "POST" && parsedUrl.pathname === "/tools/get_product") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      const parsed = body ? JSON.parse(body) : {};
      const id = parsed.id || "";
      const product = productService.getProductById(id);

      sendJson(res, 200, {
        tool: "get_product",
        input: { id },
        output: product || null
      });
    });

    return;
  }

  sendJson(res, 404, { message: "Route introuvable" });
});

server.listen(PORT, () => {
  console.log(`MCP mock server running on http://localhost:${PORT}`);
});