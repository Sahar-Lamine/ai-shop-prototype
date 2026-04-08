export default function CartPanel({ cart, onIncrement, onDecrement }) {
  const items = Object.values(cart);

  const total = items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  return (
    <aside className="cart-panel">
      <h2>Panier</h2>

      {items.length === 0 ? (
        <p>Votre panier est vide.</p>
      ) : (
        <>
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="cart-item">
              <div>
                <strong>{product.name}</strong>
                <p>
                  {product.price.toFixed(2)} {product.currency}
                </p>
              </div>

              <div className="qty-controls">
                <button onClick={() => onDecrement(product.id)}>-</button>
                <span>{quantity}</span>
                <button onClick={() => onIncrement(product.id)}>+</button>
              </div>
            </div>
          ))}

          <div className="cart-total">
            <strong>Total : {total.toFixed(2)} CHF</strong>
          </div>
        </>
      )}
    </aside>
  );
}