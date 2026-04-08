export default function ChatPanel({ input, onChange, onSubmit }) {
  return (
    <div className="chat-panel">
      <h2>Recherche conversationnelle</h2>
      <div className="chat-row">
        <input
          value={input}
          onChange={(e) => onChange(e.target.value)}
          placeholder='Ex: "je veux du sucre"'
        />
        <button onClick={onSubmit}>Envoyer</button>
      </div>
    </div>
  );
}