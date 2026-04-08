const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function fetchProducts(search = "") {
  const url = search
    ? `${API_BASE}/products?search=${encodeURIComponent(search)}`
    : `${API_BASE}/products`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Erreur lors du chargement des produits");
  }

  return res.json();
}