import { useEffect, useState } from "react";
import { fetchProducts } from "./api/productsApi";
import SearchBar from "./components/SearchBar";
import ChatPanel from "./components/ChatPanel";
import ProductGrid from "./components/ProductGrid";
import CartPanel from "./components/CartPanel";
import "./App.css";

function extractSearchTerm(text) {
  return text
    .toLowerCase()
    .replace("je veux", "")
    .replace("cherche", "")
    .replace("donne moi", "")
    .trim();
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [cart, setCart] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadProducts(term = "") {
    try {
      setLoading(true);
      setError("");
      const data = await fetchProducts(term);
      setProducts(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function addToCart(product) {
    setCart((prev) => {
      const current = prev[product.id];

      return {
        ...prev,
        [product.id]: {
          product,
          quantity: current ? current.quantity + 1 : 1
        }
      };
    });
  }

  function onIncrement(productId) {
    setCart((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: prev[productId].quantity + 1
      }
    }));
  }

  function onDecrement(productId) {
    setCart((prev) => {
      const current = prev[productId];
      if (!current) return prev;

      if (current.quantity <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }

      return {
        ...prev,
        [productId]: {
          ...current,
          quantity: current.quantity - 1
        }
      };
    });
  }

  async function handleSearch() {
    await loadProducts(search);
  }

  async function handleChatSubmit() {
    const term = extractSearchTerm(chatInput);
    setSearch(term);
    await loadProducts(term);
  }

  return (
    <div className="page">
      <div className="main-content">
        <h1>AI Shop Prototype</h1>
        <p className="subtitle">
          Catalogue e-commerce connecté à une recherche conversationnelle
        </p>

        <ChatPanel
          input={chatInput}
          onChange={setChatInput}
          onSubmit={handleChatSubmit}
        />

        <SearchBar
          value={search}
          onChange={setSearch}
          onSearch={handleSearch}
        />

        {loading && <p>Chargement...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <ProductGrid products={products} onAdd={addToCart} />
        )}
      </div>

      <CartPanel
        cart={cart}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
      />
    </div>
  );
}