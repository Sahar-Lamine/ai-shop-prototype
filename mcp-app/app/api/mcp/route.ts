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

const BACKEND_URL = process.env.BACKEND_URL!;

async function fetchProducts(search?: string): Promise<Product[]> {
  const url = search
    ? `${BACKEND_URL}/api/products?search=${encodeURIComponent(search)}`
    : `${BACKEND_URL}/api/products`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);

  const data = await res.json();
  return data.items ?? [];
}

async function fetchProductById(id: string): Promise<Product | null> {
  const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);

  return res.json();
}

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "list_products",
      "Return all products from the catalogue",
      {},
      async () => {
        const products = await fetchProducts();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(products, null, 2),
            },
          ],
        };
      }
    );

    server.tool(
      "search_products",
      "Search products by keyword such as sucre, riz, farine",
      {
        query: z.string().min(1),
      },
      async ({ query }) => {
        const products = await fetchProducts(query);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(products, null, 2),
            },
          ],
        };
      }
    );

    server.tool(
      "get_product",
      "Get one product by id",
      {
        id: z.string().min(1),
      },
      async ({ id }) => {
        const product = await fetchProductById(id);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(product, null, 2),
            },
          ],
        };
      }
    );
  },
  {},
  { basePath: "/api" }
);

export { handler as GET, handler as POST, handler as DELETE };