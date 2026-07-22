export default function App() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <header className="mb-12">
        <h1 className="text-3xl font-bold">Lumen</h1>
        <p className="text-gray-600">Usage analytics for API teams</p>
      </header>

      <section id="hero" className="mb-16">
        <h2 className="text-2xl font-semibold">See every request. Fix every spike.</h2>
        <p>
          Lumen ingests your API logs and turns them into per-endpoint latency,
          error-rate, and cost dashboards in under five minutes.
        </p>
        <button className="rounded bg-blue-600 px-4 py-2 text-white">Start free trial</button>
      </section>

      <section id="pricing" className="grid grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <h3>Starter</h3>
          <p>$0/mo — 100k events</p>
        </div>
        <div className="rounded border p-4">
          <h3>Team</h3>
          <p>$49/mo — 5M events, alerts</p>
        </div>
        <div className="rounded border p-4">
          <h3>Scale</h3>
          <p>$249/mo — unlimited, SSO</p>
        </div>
      </section>
    </main>
  )
}
