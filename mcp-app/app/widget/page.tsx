"use client";

import { useEffect, useMemo, useState } from "react";

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

type WidgetData = {
  query: string;
  total: number;
  products: Product[];
};

export default function WidgetPage() {
  const [data, setData] = useState<WidgetData>({
    query: "",
    total: 0,
    products: [],
  });

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;

      if (message.method === "ui/notifications/tool-result") {
        const structured = message.params?.structuredContent;
        if (!structured) return;

        setData({
          query: structured.query ?? "",
          total: structured.total ?? 0,
          products: Array.isArray(structured.products)
            ? structured.products
            : [],
        });
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const subtitle = useMemo(() => {
    if (data.query) {
      return `${data.total} produit(s) trouvé(s) pour « ${data.query} »`;
    }
    return `${data.total} produit(s) disponibles`;
  }, [data]);

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Résultats catalogue</h1>
        <p style={styles.subtitle}>{subtitle}</p>
      </div>

      <div style={styles.chips}>
        <span style={styles.chip}>
          {data.query ? `Recherche : ${data.query}` : "Tous les produits"}
        </span>
        <span style={styles.chip}>{data.total} résultat(s)</span>
      </div>

      {data.products.length === 0 ? (
        <div style={styles.empty}>Aucun produit trouvé.</div>
      ) : (
        <div style={styles.grid}>
          {data.products.map((product) => (
            <article key={product.id} style={styles.card}>
              <div style={styles.imageWrap}>
                <img
                  src={product.image}
                  alt={product.name}
                  style={styles.image}
                />
              </div>

              <div style={styles.cardBody}>
                <div style={styles.category}>{product.category}</div>
                <h2 style={styles.productName}>{product.name}</h2>
                <p style={styles.description}>{product.description}</p>

                <div style={styles.metaRow}>
                  <div style={styles.price}>
                    {Number(product.price).toFixed(2)} {product.currency}
                  </div>
                  <div style={styles.stock}>Stock : {product.stock}</div>
                </div>

                <div style={styles.tags}>
                  {(product.tags || []).map((tag) => (
                    <span key={tag} style={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 16,
    background: "#f6f7fb",
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    color: "#111827",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    margin: "0 0 6px 0",
    fontSize: 22,
    fontWeight: 700,
  },
  subtitle: {
    margin: 0,
    color: "#6b7280",
    fontSize: 14,
  },
  chips: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  chip: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    color: "#6b7280",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  imageWrap: {
    aspectRatio: "4 / 3",
    background: "#f3f4f6",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  cardBody: {
    padding: 16,
  },
  category: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  productName: {
    margin: "0 0 8px 0",
    fontSize: 18,
    lineHeight: 1.35,
  },
  description: {
    margin: "0 0 14px 0",
    color: "#6b7280",
    fontSize: 14,
    minHeight: 42,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 700,
  },
  stock: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    background: "#ecfdf5",
    color: "#065f46",
    fontWeight: 600,
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    fontSize: 12,
    color: "#6b7280",
    padding: "5px 8px",
    border: "1px solid #e5e7eb",
    borderRadius: 999,
    background: "#fafafa",
  },
  empty: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 24,
    textAlign: "center",
    color: "#6b7280",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
};