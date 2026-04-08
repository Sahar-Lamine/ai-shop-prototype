import ProductCard from "./ProductCard";

export default function ProductGrid({ products, onAdd }) {
  if (!products.length) {
    return <p>Aucun produit trouvé.</p>;
  }

  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onAdd={onAdd} />
      ))}
    </div>
  );
}