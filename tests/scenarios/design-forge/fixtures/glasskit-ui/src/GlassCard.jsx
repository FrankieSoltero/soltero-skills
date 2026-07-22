export function GlassCard({ title, price, cta }) {
  return (
    <div className="gk-card">
      <h3 className="gk-title">{title}</h3>
      <p className="gk-price">{price}</p>
      <button className="gk-cta">{cta}</button>
    </div>
  )
}
