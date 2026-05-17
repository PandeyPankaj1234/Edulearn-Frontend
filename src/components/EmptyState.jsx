export default function EmptyState({ title, text }) {
  return (
    <div className="state-box">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
