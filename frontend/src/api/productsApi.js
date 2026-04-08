const API_BASE = "https://backend-dusky-delta-10.vercel.app/api";

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