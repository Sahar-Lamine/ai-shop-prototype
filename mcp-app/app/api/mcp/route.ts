import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

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

const widgetHtml = String.raw`<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Products Grid</title>
    <style>
      body {
        margin: 0;
        padding: 16px;
        font-family: Inter, Arial, sans-serif;
        background: #f6f7fb;
        color: #111827;
      }
      .title {
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 6px;
      }
      .subtitle {
        color: #6b7280;
        margin: 0 0 16px;
        font-size: 14px;
      }
      .chips {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        margin-bottom: 18px;
      }
      .chip {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 13px;
        color: #6b7280;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 16px;
      }
      .card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      }
      .img-wrap {
        aspect-ratio: 4 / 3;
        background: #f3f4f6;
      }
      .img-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .body {
        padding: 16px;
      }
      .category {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 8px;
      }
      .name {
        margin: 0 0 8px;
        font-size: 18px;
        line-height: 1.35;
      }
      .desc {
        margin: 0 0 14px;
        color: #6b7280;
        font-size: 14px;
        min-height: 42px;
      }
      .meta {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        margin-bottom: 12px;
      }
      .price {
        font-size: 18px;
        font-weight: 700;
      }
      .stock {
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 999px;
        background: #ecfdf5;
        color: #065f46;
        font-weight: 600;
      }
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .tag {
        font-size: 12px;
        color: #6b7280;
        padding: 5px 8px;
        border: 1px solid #e5e7eb;
        border-radius: 999px;
        background: #fafafa;
      }
      .empty {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 18px;
        padding: 24px;
        text-align: center;
        color: #6b7280;
        box-shadow: 0 8px 24px rgba(0,0,0,0.08);
      }
    </style>
  </head>
  <body>
    <h1 class="title">Résultats catalogue</h1>
    <p class="subtitle" id="subtitle">Chargement…</p>
    <div class="chips" id="chips"></div>
    <div id="app" class="empty">Aucun produit.</div>

    <script>
      const appEl = document.getElementById("app");
      const subtitleEl = document.getElementById("subtitle");
      const chipsEl = document.getElementById("chips");

      function esc(v) {
        return String(v ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      function render(data) {
        const query = data?.query ?? "";
        const total = data?.total ?? 0;
        const products = Array.isArray(data?.products) ? data.products : [];

        subtitleEl.textContent = query
          ? total + " produit(s) trouvé(s) pour « " + query + " »"
          : total + " produit(s) disponibles";

        chipsEl.innerHTML = "";
        const chip1 = document.createElement("div");
        chip1.className = "chip";
        chip1.textContent = query ? "Recherche : " + query : "Tous les produits";
        chipsEl.appendChild(chip1);

        const chip2 = document.createElement("div");
        chip2.className = "chip";
        chip2.textContent = total + " résultat(s)";
        chipsEl.appendChild(chip2);

        if (!products.length) {
          appEl.innerHTML = '<div class="empty">Aucun produit trouvé.</div>';
          return;
        }

        appEl.innerHTML =
          '<div class="grid">' +
          products.map((p) => {
            const tags = (p.tags || [])
              .map((tag) => '<span class="tag">' + esc(tag) + '</span>')
              .join("");

            return (
              '<article class="card">' +
                '<div class="img-wrap">' +
                  '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '">' +
                '</div>' +
                '<div class="body">' +
                  '<div class="category">' + esc(p.category || "Catalogue") + '</div>' +
                  '<h2 class="name">' + esc(p.name) + '</h2>' +
                  '<p class="desc">' + esc(p.description || "") + '</p>' +
                  '<div class="meta">' +
                    '<div class="price">' + Number(p.price).toFixed(2) + " " + esc(p.currency || "CHF") + '</div>' +
                    '<div class="stock">Stock : ' + esc(p.stock ?? 0) + '</div>' +
                  '</div>' +
                  '<div class="tags">' + tags + '</div>' +
                '</div>' +
              '</article>'
            );
          }).join("") +
          '</div>';
      }

      window.addEventListener("message", (event) => {
        const message = event.data;
        if (!message || message.jsonrpc !== "2.0") return;

        if (message.method === "ui/notifications/tool-result") {
          const structured = message.params?.structuredContent;
          if (!structured) return;
          render(structured);
        }
      });

      render({ query: "", total: 0, products: [] });
    </script>
  </body>
</html>`;

async function fetchProducts(search?: string): Promise<Product[]> {
  const url = search
    ? `${BACKEND_URL}/api/products?search=${encodeURIComponent(search)}`
    : `${BACKEND_URL}/api/products`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Backend error while fetching products: ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data?.items) ? data.items : [];
}

async function fetchProductById(id: string): Promise<Product | null> {
  const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Backend error while fetching product ${id}: ${res.status}`);
  }

  return res.json();
}

function uiMeta() {
  return {
    ui: {
      resourceUri: WIDGET_URI,
    },
    "openai/outputTemplate": WIDGET_URI,
    "openai/toolInvocation/invoking": "Chargement des produits…",
    "openai/toolInvocation/invoked": "Produits affichés.",
  };
}

const handler = createMcpHandler(
  (server) => {
    server.resource("products-grid", WIDGET_URI, async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: WIDGET_MIME,
          text: widgetHtml,
          _meta: {
            "openai/widgetDescription":
              "Une grille de produits e-commerce avec image, prix, description et stock.",
            "openai/widgetPrefersBorder": true,
            "openai/widgetCSP": {
              connect_domains: [new URL(BACKEND_URL).origin],
              resource_domains: [
                new URL(BACKEND_URL).origin,
                "https://via.placeholder.com"
              ]
            }
          },
        },
      ],
    }));

    server.tool(
      "list_products",
      "Retourne tous les produits du catalogue.",
      {},
      async () => {
        const products = await fetchProducts();

        return {
          structuredContent: {
            query: "",
            total: products.length,
            products,
          },
          content: [
            {
              type: "text",
              text: `${products.length} produit(s) disponibles.`,
            },
          ],
          _meta: uiMeta(),
        };
      }
    );

    server.tool(
      "search_products",
      "Recherche des produits par mot-clé.",
      {
        query: z.string().min(1),
      },
      async ({ query }) => {
        const trimmed = query.trim();
        const products = await fetchProducts(trimmed);

        return {
          structuredContent: {
            query: trimmed,
            total: products.length,
            products,
          },
          content: [
            {
              type: "text",
              text: `${products.length} produit(s) trouvé(s) pour « ${trimmed} ».`,
            },
          ],
          _meta: uiMeta(),
        };
      }
    );

    server.tool(
      "get_product",
      "Retourne le détail d’un produit par id.",
      {
        id: z.string().min(1),
      },
      async ({ id }) => {
        const trimmed = id.trim();
        const product = await fetchProductById(trimmed);
        const products = product ? [product] : [];

        return {
          structuredContent: {
            query: "",
            total: products.length,
            products,
          },
          content: [
            {
              type: "text",
              text: product
                ? `Détail du produit : ${product.name}.`
                : `Aucun produit trouvé pour l’identifiant ${trimmed}.`,
            },
          ],
          _meta: uiMeta(),
        };
      }
    );
  },
  {},
  { basePath: "/api" }
);

export { handler as GET, handler as POST, handler as DELETE };