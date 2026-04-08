const products = require("../data/products.json");

function normalize(text = "") {
  return text.toLowerCase().trim();
}

function getAllProducts() {
  return products;
}

function getProductById(id) {
  return products.find((p) => p.id === String(id));
}

function searchProducts(search = "") {
  const q = normalize(search);
  if (!q) return products;

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.description,
      product.category,
      ...(product.tags || [])
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

module.exports = {
  getAllProducts,
  getProductById,
  searchProducts
};