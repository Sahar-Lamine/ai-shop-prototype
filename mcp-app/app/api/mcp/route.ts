import { z } from "zod";
import { createMcpHandler } from "mcp-handler";

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
const APP_URL = process.env.APP_URL;

if (!BACKEND_URL) {
  throw new Error("Missing BACKEND_URL environment variable");
}

if (!APP_URL) {
  throw new Error("Missing APP_URL environment variable");
}

const WIDGET_URI = "ui://widget/products-grid";
const WIDGET_URL = new URL("/widget", APP_URL).toString();

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

function toolMeta() {
  return {
    ui: {
      resourceUri: WIDGET_URI,
    },
    "openai/outputTemplate": WIDGET_URI,
    "openai/toolInvocation/invoking": "Chargement des produits…",
    "openai/toolInvocation/invoked": "Produits affichés.",
    "openai/widgetAccessible": true,
  };
}

const handler = createMcpHandler(
  (server) => {
    server.resource(
      "products-grid",
      WIDGET_URI,
      async () => {
        const html = await fetch(WIDGET_URL, { cache: "no-store" }).then((r) =>
          r.text()
        );

        return {
          contents: [
            {
              uri: WIDGET_URI,
              mimeType: "text/html;profile=mcp-app",
              text: html,
              _meta: {
                "openai/widgetDescription":
                  "Une grille de produits e-commerce avec image, prix, description et stock.",
                "openai/widgetPrefersBorder": true,
              },
            },
          ],
        };
      }
    );

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
              text: `${products.length} produit(s) disponibles dans le catalogue.`,
            },
          ],
          _meta: toolMeta(),
        };
      }
    );

    server.tool(
      "search_products",
      "Recherche des produits du catalogue par mot-clé.",
      {
        query: z.string().min(1),
      },
      async ({ query }) => {
        const products = await fetchProducts(query.trim());

        return {
          structuredContent: {
            query,
            total: products.length,
            products,
          },
          content: [
            {
              type: "text",
              text: `${products.length} produit(s) trouvé(s) pour « ${query} ».`,
            },
          ],
          _meta: toolMeta(),
        };
      }
    );

    server.tool(
      "get_product",
      "Retourne le détail d’un produit via son identifiant.",
      {
        id: z.string().min(1),
      },
      async ({ id }) => {
        const product = await fetchProductById(id.trim());

        if (!product) {
          return {
            structuredContent: {
              query: "",
              total: 0,
              products: [],
            },
            content: [
              {
                type: "text",
                text: `Aucun produit trouvé pour l’identifiant ${id}.`,
              },
            ],
            _meta: toolMeta(),
          };
        }

        return {
          structuredContent: {
            query: "",
            total: 1,
            products: [product],
          },
          content: [
            {
              type: "text",
              text: `Détail du produit : ${product.name}.`,
            },
          ],
          _meta: toolMeta(),
        };
      }
    );
  },
  {},
  { basePath: "/api" }
);

export { handler as GET, handler as POST, handler as DELETE };