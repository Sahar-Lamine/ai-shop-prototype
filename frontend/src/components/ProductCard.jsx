export default function ProductCard({ product, onAdd }) {
  return (
    <div className="product-card">
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="product-meta">
        <strong>
          {product.price.toFixed(2)} {product.currency}
        </strong>
        <button onClick={() => onAdd(product)}>Ajouter</button>
      </div>
    </div>
  );
}