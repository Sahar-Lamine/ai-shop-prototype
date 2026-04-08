import { readFileSync } from "node:fs";
import { join } from "node:path";
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

if (!BACKEND_URL) {
  throw new Error("Missing BACKEND_URL environment variable");
}

const BACKEND_ORIGIN = new URL(BACKEND_URL).origin;
const WIDGET_URI = "ui://widget/products-grid.html";

const widgetHtml = readFileSync(
  join(process.cwd(), "public", "products-widget.html"),
  "utf8"
);

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

function getToolMeta() {
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
    // 1) Register the UI resource used by ChatGPT to render the grid
    server.registerResource(
      "products-grid-widget",
      WIDGET_URI,
      {
        title: "Products Grid",
        description: "Affiche les produits du catalogue sous forme de grille.",
        mimeType: "text/html+skybridge",
      },
      async () => ({
        contents: [
          {
            uri: WIDGET_URI,
            mimeType: "text/html+skybridge",
            text: widgetHtml,
            _meta: {
              "openai/widgetDescription":
                "Une grille de produits e-commerce avec image, prix, description, stock et actions.",
              "openai/widgetPrefersBorder": true,
              "openai/widgetCSP": {
                connect_domains: [BACKEND_ORIGIN],
                resource_domains: [
                  BACKEND_ORIGIN,
                  "https://via.placeholder.com",
                ],
              },
            },
          },
        ],
      })
    );

    // 2) Tool: list all products
    server.registerTool(
      "list_products",
      {
        title: "Lister les produits",
        description: "Retourne tous les produits du catalogue.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: false,
          idempotentHint: true,
        },
        _meta: getToolMeta(),
      },
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
          _meta: {
            source: "catalogue",
          },
        };
      }
    );

    // 3) Tool: search products
    server.registerTool(
      "search_products",
      {
        title: "Rechercher des produits",
        description:
          "Recherche des produits du catalogue par mot-clé, par exemple sucre, riz ou farine.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              minLength: 1,
              description: "Mot-clé de recherche produit",
            },
          },
          required: ["query"],
          additionalProperties: false,
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: false,
          idempotentHint: true,
        },
        _meta: getToolMeta(),
      },
      async (args: { query: string }) => {
        const query = (args?.query ?? "").trim();
        const products = await fetchProducts(query);

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
          _meta: {
            query,
          },
        };
      }
    );

    // 4) Tool: get one product
    server.registerTool(
      "get_product",
      {
        title: "Détail produit",
        description: "Retourne le détail d’un produit par son identifiant.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "string",
              minLength: 1,
              description: "Identifiant du produit",
            },
          },
          required: ["id"],
          additionalProperties: false,
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: false,
          idempotentHint: true,
        },
        _meta: getToolMeta(),
      },
      async (args: { id: string }) => {
        const id = (args?.id ?? "").trim();
        const product = await fetchProductById(id);

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
            _meta: {
              missingId: id,
            },
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
          _meta: {
            selectedId: id,
          },
        };
      }
    );
  },
  {},
  { basePath: "/api" }
);

export { handler as GET, handler as POST, handler as DELETE };