const productService = require("../services/productService");

async function handleMcp(req, res) {
  try {
    if (req.method === "GET") {
      return res.json({
        name: "ai-shop-mcp",
        version: "1.0.0",
        tools: [
          {
            name: "list_products",
            description: "Return all catalogue products"
          },
          {
            name: "search_products",
            description: "Search products by keyword"
          },
          {
            name: "get_product",
            description: "Get product details by id"
          }
        ]
      });
    }

    if (req.method === "POST") {
      const { tool, input } = req.body || {};

      if (tool === "list_products") {
        return res.json({
          tool,
          output: productService.getAllProducts()
        });
      }

      if (tool === "search_products") {
        const query = input?.query || "";
        return res.json({
          tool,
          input: { query },
          output: productService.searchProducts(query)
        });
      }

      if (tool === "get_product") {
        const id = input?.id || "";
        return res.json({
          tool,
          input: { id },
          output: productService.getProductById(id) || null
        });
      }

      return res.status(400).json({
        message: "Unknown tool",
        received: { tool, input }
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({
      message: "MCP handler error",
      error: error.message
    });
  }
}

module.exports = { handleMcp };