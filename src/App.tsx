import { Monitor, PenTool, Layers, Mail, ArrowRight } from 'lucide-react';

const services = [
  {
    title: 'Logo Design',
    description: 'Distinctive logos crafted to make your brand instantly recognizable.',
    icon: PenTool,
  },
  {
    title: 'Brand Identity',
    description: 'Complete visual systems including colors, type, and usage guidelines.',
    icon: Layers,
  },
  {
    title: 'Social Media Design',
    description: 'High-converting post templates and ad creatives for modern platforms.',
    icon: Monitor,
  },
];

const projects = [
  { name: 'Nova Coffee', type: 'Branding', color: 'from-orange-500/60 to-yellow-500/40' },
  { name: 'Pulse Fitness', type: 'Social Design', color: 'from-cyan-500/50 to-blue-500/40' },
  { name: 'Luma Studio', type: 'Logo + Web', color: 'from-fuchsia-500/50 to-purple-500/40' },
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <h1 className="text-xl font-bold tracking-tight">Wahab Graphics</h1>
        <a
          href="#contact"
          className="rounded-full border border-slate-700 px-4 py-2 text-sm hover:border-orange-400 hover:text-orange-300"
        >
          Contact
        </a>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-20">
        <section className="grid gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-orange-300">
              Creative Graphic Design Studio
            </p>
            <h2 className="text-4xl font-black leading-tight md:text-6xl">
              We build bold visuals that grow your brand.
            </h2>
            <p className="mt-5 max-w-xl text-slate-300">
              From logos and brand kits to social media campaigns, we design with strategy,
              style, and measurable business outcomes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 font-medium text-white transition hover:bg-orange-400"
              >
                View Projects <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#services"
                className="rounded-lg border border-slate-700 px-5 py-3 font-medium transition hover:border-slate-500"
              >
                Explore Services
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/60 p-6 shadow-2xl">
            <p className="text-sm text-slate-400">Trusted by startups and creators</p>
            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-2xl font-bold text-orange-300">120+</p>
                <p className="text-xs text-slate-400">Projects Completed</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                <p className="text-2xl font-bold text-orange-300">98%</p>
                <p className="text-xs text-slate-400">Client Satisfaction</p>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="scroll-mt-20 py-12">
          <h3 className="text-2xl font-bold md:text-3xl">Services</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {services.map(({ title, description, icon: Icon }) => (
              <article key={title} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
                <Icon className="h-7 w-7 text-orange-300" />
                <h4 className="mt-4 text-lg font-semibold">{title}</h4>
                <p className="mt-2 text-sm text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="projects" className="scroll-mt-20 py-12">
          <h3 className="text-2xl font-bold md:text-3xl">Featured Projects</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.name}
                className={`rounded-xl border border-slate-800 bg-gradient-to-br ${project.color} p-5`}
              >
                <p className="text-xs uppercase tracking-wider text-white/80">{project.type}</p>
                <h4 className="mt-2 text-xl font-bold text-white">{project.name}</h4>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 py-12">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <Mail className="mx-auto h-8 w-8 text-orange-300" />
            <h3 className="mt-4 text-2xl font-bold">Let&apos;s design your next project</h3>
            <p className="mx-auto mt-2 max-w-xl text-slate-300">
              Tell us about your business goals and we&apos;ll craft a custom design package for you.
            </p>
            <a
              href="mailto:hello@wahabgraphics.com"
              className="mt-6 inline-block rounded-lg bg-orange-500 px-5 py-3 font-medium text-white hover:bg-orange-400"
            >
              hello@wahabgraphics.com
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
