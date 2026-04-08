import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { URL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  type CallToolRequest,
  type ListResourcesRequest,
  type ListToolsRequest,
  type ReadResourceRequest,
  type Resource,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// --- Types & Configuration ---

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  image: string;
  description: string;
  category: string;
  tags?: string[];
  stock: number;
};

const BACKEND_URL = process.env.BACKEND_URL;
if (!BACKEND_URL) {
  throw new Error("Missing BACKEND_URL environment variable");
}

const WIDGET_URI = "ui://widget/products-grid.html";
const WIDGET_MIME = "text/html;profile=mcp-app";

// --- Inline HTML Widget ---
// (Kept inline as per your original file, but used by the resource handler)
const widgetHtml = String.raw`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <style>
      body { margin: 0; padding: 16px; font-family: Inter, sans-serif; background: #f6f7fb; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
      .card { background: white; border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
      .img-wrap { aspect-ratio: 4 / 3; background: #f3f4f6; }
      .img-wrap img { width: 100%; height: 100%; object-fit: cover; }
      .body { padding: 16px; }
      .price { font-size: 18px; font-weight: 700; color: #111827; }
      .stock { font-size: 12px; padding: 4px 8px; border-radius: 999px; background: #ecfdf5; color: #065f46; }
    </style>
  </head>
  <body>
    <h1 id="title">Catalogue</h1>
    <div id="app">Chargement...</div>
    <script>
      const appEl = document.getElementById("app");
      window.addEventListener("message", (event) => {
        const message = event.data;
        if (message?.method === "ui/notifications/tool-result") {
          const data = message.params?.structuredContent;
          if (!data?.products) return;
          appEl.innerHTML = '<div class="grid">' + data.products.map(p => `
            <article class="card">
              <div class="img-wrap"><img src="${p.image}"></div>
              <div class="body">
                <h3>${p.name}</h3>
                <div style="display:flex; justify-content:space-between; align-items:center">
                  <span class="price">${p.price} ${p.currency}</span>
                  <span class="stock">Stock: ${p.stock}</span>
                </div>
              </div>
            </article>
          `).join('') + '</div>';
        }
      });
    </script>
  </body>
</html>`;

// --- Data Fetching Logic ---

async function fetchProducts(search?: string): Promise<Product[]> {
  const url = search
    ? `${BACKEND_URL}/api/products?search=${encodeURIComponent(search)}`
    : `${BACKEND_URL}/api/products`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data?.items) ? data.items : [];
}

async function fetchProductById(id: string): Promise<Product | null> {
  const res = await fetch(`${BACKEND_URL}/api/products/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

// --- MCP Server Setup ---

function createProductServer(): Server {
  const server = new Server(
    { name: "product-catalog-server", version: "1.0.0" },
    { capabilities: { resources: {}, tools: {} } }
  );

  // 1. Resources: Provide the HTML Widget
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [{
      uri: WIDGET_URI,
      name: "Product Grid UI",
      description: "A grid view for displaying products",
      mimeType: WIDGET_MIME
    }]
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    if (request.params.uri !== WIDGET_URI) {
      throw new Error(`Unknown resource: ${request.params.uri}`);
    }
    return {
      contents: [{
        uri: WIDGET_URI,
        mimeType: WIDGET_MIME,
        text: widgetHtml,
        _meta: { "openai/widgetDescription": "Grille de produits" }
      }]
    };
  });

  // 2. Tools: Define Search and List
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "list_products",
        description: "Returns all products in the catalog.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "search_products",
        description: "Search products by keyword.",
        inputSchema: {
          type: "object",
          properties: { query: { type: "string" } },
          required: ["query"]
        }
      }
    ]
  }));

  // 3. Tool Execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    let products: Product[] = [];
    let queryText = "";

    switch (request.params.name) {
      case "list_products":
        products = await fetchProducts();
        break;
      case "search_products":
        const { query } = z.object({ query: z.string() }).parse(request.params.arguments);
        queryText = query;
        products = await fetchProducts(query);
        break;
      default:
        throw new Error("Tool not found");
    }

    return {
      content: [{ type: "text", text: `Found ${products.length} products.` }],
      structuredContent: { query: queryText, total: products.length, products },
      _meta: {
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Searching catalog...",
        "openai/toolInvocation/invoked": "Products loaded."
      }
    };
  });

  return server;
}

// --- HTTP & Transport Handling ---

const sessions = new Map<string, { server: Server; transport: SSEServerTransport }>();

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url ?? "", `http://${req.headers.host}`);

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  // SSE Endpoint
  if (req.method === "GET" && url.pathname === "/mcp") {
    const server = createProductServer();
    const transport = new SSEServerTransport("/mcp/messages", res);
    sessions.set(transport.sessionId, { server, transport });
    
    transport.onclose = async () => {
      sessions.delete(transport.sessionId);
      await server.close();
    };
    
    await server.connect(transport);
    return;
  }

  // Message Posting Endpoint
  if (req.method === "POST" && url.pathname === "/mcp/messages") {
    const sessionId = url.searchParams.get("sessionId");
    const session = sessionId ? sessions.get(sessionId) : null;
    if (!session) return res.writeHead(404).end("Session not found");
    
    await session.transport.handlePostMessage(req, res);
    return;
  }

  res.writeHead(404).end();
});

const PORT = process.env.PORT || 8000;
httpServer.listen(PORT, () => {
  console.log(`Product MCP Server running on http://localhost:${PORT}/mcp`);
});