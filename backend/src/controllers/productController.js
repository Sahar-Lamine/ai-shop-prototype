const productService = require("../services/productService");

function listProducts(req, res) {
  const { search } = req.query;

  const items = search
    ? productService.searchProducts(search)
    : productService.getAllProducts();

  res.json({
    total: items.length,
    items
  });
}

function getProduct(req, res) {
  const product = productService.getProductById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Produit introuvable" });
  }

  res.json(product);
}

module.exports = {
  listProducts,
  getProduct
};