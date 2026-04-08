export default function SearchBar({ value, onChange, onSearch }) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Rechercher un produit..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button onClick={onSearch}>Rechercher</button>
    </div>
  );
}