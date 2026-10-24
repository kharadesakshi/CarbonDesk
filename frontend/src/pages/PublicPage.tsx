import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function PublicPage() {
  return (
    <div className="min-h-screen bg-forest text-white">
      <header className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 text-2xl font-bold">◉ CarbonDesk</div>
        <nav className="hidden gap-7 text-sm font-bold md:flex">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>
        </nav>
        <Link className="rounded bg-white px-4 py-2 text-sm font-bold text-forest" to="/login">
          Login <ArrowRight className="inline h-4" />
        </Link>
      </header>

      <main className="mx-auto grid max-w-[1440px] gap-10 px-6 pb-20 pt-16 lg:grid-cols-2 lg:items-center">
        <section>
          <span className="rounded border border-white/30 px-3 py-1 text-xs font-bold">
            Enterprise Grade MRV
          </span>
          <h1 className="mt-6 text-5xl font-bold leading-tight md:text-6xl">
            Centralize Your <span className="text-emerald-300">Carbon Project</span> Management.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">
            One unified platform for developers, participants, and field teams to manage MRV, GIS, and
            audit-ready documentation with precision.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded bg-emerald-500 px-6 py-3 font-bold text-forest-deep"
              to="/login"
            >
              Request Demo
            </Link>
            <a className="rounded border border-white/30 px-6 py-3 font-bold" href="#features">
              Explore Platform
            </a>
          </div>
        </section>

        <section className="min-h-80 rounded border border-white/15 bg-gradient-to-br from-white/10 to-black/15 p-8 shadow-lg">
          <p className="text-sm font-bold text-emerald-200">UNIFIED PROJECT WORKSPACE</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded bg-white p-4 text-forest">
              <b>100+</b>
              <p className="text-xs">Projects Managed</p>
            </div>
            <div className="rounded bg-white/10 p-4">
              <b>1000+</b>
              <p className="text-xs">Participants</p>
            </div>
            <div className="col-span-2 rounded bg-white/10 p-4">GIS • Participants • Documents • MRV</div>
          </div>
        </section>
      </main>

      <section id="features" className="bg-white px-6 py-16 text-ink">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="text-3xl font-bold text-forest-deep">End the Fragmentation</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ['Unified Data', 'One source of truth for your portfolio.'],
              ['Audit-Ready', 'Structured evidence for verification.'],
              ['Collaboration', 'Connect field teams and developers.'],
            ].map(([a, b]) => (
              <article key={a} className="rounded border border-line p-5">
                <h3 className="font-bold text-forest">{a}</h3>
                <p className="mt-2 text-sm text-stone-600">{b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
