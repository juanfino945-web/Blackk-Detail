'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const WHATSAPP_NUMBER = '543492270506';

function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
function productWaText(name) {
  return `Hola Blackk Detail, estoy interesado en el producto: ${name}. ¿Me pueden pasar más información?`;
}
const priceFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const genericWa = waLink('Hola Blackk Detail, quiero consultar por sus productos.');

function WspIcon({ className }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={className}>
      <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.696 4.607 1.897 6.48L4 29l7.72-1.855A11.94 11.94 0 0 0 16 27c6.628 0 12-5.373 12-12S22.629 3 16.001 3z" />
    </svg>
  );
}

// Aparece con fade + subida cuando entra en pantalla
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ '--delay': `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function CatalogClient({ initialProducts }) {
  const [products] = useState(initialProducts);
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [selected, setSelected] = useState(null);

  const heroRef = useRef(null);
  const heroContentRef = useRef(null);
  const heroLogoRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    let ticking = false;
    function update() {
      const heroHeight = heroEl.offsetHeight || 1;
      const progress = Math.min(Math.max(window.scrollY / heroHeight, 0), 1);
      if (heroContentRef.current) {
        heroContentRef.current.style.transform = `translateY(${progress * 30}px) scale(${1 - progress * 0.06})`;
        heroContentRef.current.style.opacity = `${1 - progress * 1.15}`;
      }
      if (heroLogoRef.current) {
        heroLogoRef.current.style.transform = `translateY(${progress * -50}px) scale(${1 + progress * 0.04})`;
        heroLogoRef.current.style.opacity = `${1 - progress * 1.15}`;
      }
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(products.map(p => p.category)))],
    [products]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(p => {
      const matchCat = category === 'Todos' || p.category === category;
      const matchTerm = !term || p.name.toLowerCase().includes(term);
      return matchCat && matchTerm;
    });
  }, [products, search, category]);

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`sticky top-0 z-50 bg-[var(--dark)] border-b border-white/10 transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]' : ''
        }`}
      >
        <div
          className={`max-w-6xl mx-auto px-6 flex items-center justify-between transition-all duration-300 ${
            scrolled ? 'h-[60px]' : 'h-[72px]'
          }`}
        >
          <a href="#inicio" className="text-white font-display font-bold text-xl tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--steel)]" /> Blackk Detail
          </a>
          <ul className={`md:flex gap-9 list-none ${navOpen ? 'flex flex-col absolute top-full left-0 right-0 bg-[var(--dark)] p-6' : 'hidden'} md:static md:bg-transparent md:p-0`}>
            <li><a href="#inicio" className="text-gray-300 hover:text-white text-sm transition-colors">Inicio</a></li>
            <li><a href="#catalogo" className="text-gray-300 hover:text-white text-sm transition-colors">Catálogo</a></li>
            <li><a href="#nosotros" className="text-gray-300 hover:text-white text-sm transition-colors">Nosotros</a></li>
            <li><a href="#contacto" className="text-gray-300 hover:text-white text-sm transition-colors">Contacto</a></li>
          </ul>
          <button className="md:hidden text-white" onClick={() => setNavOpen(!navOpen)} aria-label="Abrir menú">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header id="inicio" ref={heroRef} className="bg-gradient-to-br from-[var(--dark)] via-[#22262b] to-[#2c3036] text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
          <div ref={heroContentRef} className="hero-parallax">
            <span
              className="hero-anim inline-block text-[var(--steel)] text-xs font-semibold tracking-widest uppercase"
              style={{ animationDelay: '0.05s' }}
            >
              Detailing &amp; cuidado automotor
            </span>
            <h1
              className="hero-anim font-display font-bold text-4xl md:text-6xl mt-4 leading-tight"
              style={{ animationDelay: '0.15s' }}
            >
              Blackk Detail
            </h1>
            <p className="hero-anim text-gray-300 mt-5 max-w-md" style={{ animationDelay: '0.3s' }}>
              Ceras, aromatizantes, accesorios y línea Vonixx para dejar tu auto como recién salido de la concesionaria.
            </p>
            <div className="hero-anim flex flex-wrap gap-3 mt-8" style={{ animationDelay: '0.45s' }}>
              <a href="#catalogo" className="btn btn-primary">Ver catálogo</a>
              <a href={genericWa} target="_blank" rel="noopener noreferrer" className="btn btn-wsp">
                <WspIcon className="w-4 h-4" /> Consultar por WhatsApp
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <div ref={heroLogoRef} className="hero-parallax hero-logo bg-white/5 border border-white/10 p-6 max-w-[280px]">
              <img src="/logo.jpg" alt="Blackk Detail" className="rounded-sm" />
            </div>
          </div>
        </div>
      </header>

      {/* CATALOGO */}
      <section id="catalogo" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <h2 className="font-display text-3xl md:text-4xl">Catálogo</h2>
            <p className="text-[var(--ink-soft)] mt-2 mb-8 max-w-xl">
              Filtrá por categoría o buscá un producto. Los precios están actualizados en pesos argentinos.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex flex-wrap gap-4 items-center bg-white border border-[var(--line)] p-4 mb-8">
              <input
                type="search"
                placeholder="Buscar producto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 min-w-[220px] border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 text-xs font-medium rounded-full border transition-colors duration-200 ${category === cat ? 'bg-[var(--dark)] text-white border-[var(--dark)]' : 'border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--dark)] hover:text-[var(--ink)]'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <p className="text-sm text-[var(--ink-soft)] mb-5">
            {filtered.length} {filtered.length === 1 ? 'producto encontrado' : 'productos encontrados'}
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[var(--line)] text-[var(--ink-soft)]">
              No encontramos productos con esa búsqueda. Probá con otro nombre o categoría.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filtered.map((p, i) => (
                <Reveal key={p.id} delay={(i % 4) * 80} className="h-full">
                  <article className="product-card bg-white border border-[var(--line)] flex flex-col h-full">
                    <div className="shine relative bg-[#EAE8E2] aspect-square overflow-hidden border-b border-[var(--line)]">
                      <span className="absolute top-2 left-2 z-10 bg-black/80 text-white text-[10px] font-semibold px-2 py-1 rounded-full uppercase">
                        {p.category}
                      </span>
                      <img src={p.image} alt={p.name} loading="lazy" className="product-img w-full h-full object-cover" />
                    </div>
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <h3 className="text-sm font-semibold min-h-[38px]">{p.name}</h3>
                      <div className="font-display text-xl font-semibold">{priceFmt.format(p.price)}</div>
                      <div className="flex gap-2 mt-auto pt-2">
                        <button onClick={() => setSelected(p)} className="flex-1 btn-dark text-xs px-3 py-2 border">
                          Ver detalle
                        </button>
                        
                         <a href={waLink(productWaText(p.name))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-[#1E2A22] hover:bg-[#25342A] transition-colors text-white text-xs px-3 py-2 flex items-center justify-center gap-1"
                        >
                          <WspIcon className="w-3.5 h-3.5" /> Consultar
                        </a>
                      </div>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* NOSOTROS */}
      <section id="nosotros" className="bg-[var(--dark)] text-white py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <Reveal>
            <span className="text-[var(--steel)] text-xs font-semibold tracking-widest uppercase">Nosotros</span>
            <h2 className="font-display text-3xl mt-3">Blackk Detail</h2>
            <p className="text-gray-300 mt-4 max-w-md">
              Somos un espacio dedicado al detailing y cuidado automotor, con una selección de ceras, aromatizantes, accesorios y productos de la línea Vonixx pensada para quienes cuidan cada detalle de su auto.
            </p>
            <p className="text-gray-300 mt-4 max-w-md">
              Podés consultarnos por cualquier producto del catálogo directamente por WhatsApp o seguirnos en Instagram para ver el trabajo día a día.
            </p>
          </Reveal>
          <Reveal delay={150}>
            <div className="grid grid-cols-2 gap-3">
              {products.slice(0, 2).map(p => (
                <img key={p.id} src={p.image} alt={p.name} loading="lazy" className="aspect-square object-cover border border-white/10" />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="bg-[var(--bg)] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal>
            <h2 className="font-display text-3xl md:text-4xl">Contacto</h2>
            <p className="text-[var(--ink-soft)] mt-2 mb-8 max-w-xl">
              Escribinos por WhatsApp, mail o Instagram para consultar precios, disponibilidad o hacer tu pedido.
            </p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5">
            <Reveal delay={0} className="bg-white border border-[var(--line)] p-8 flex flex-col gap-3">
              <div className="w-11 h-11 rounded-full bg-[var(--dark)] text-white flex items-center justify-center">
                <WspIcon className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg">WhatsApp</h3>
              <a href={genericWa} target="_blank" rel="noopener noreferrer" className="btn btn-wsp self-start">Abrir chat</a>
            </Reveal>
            <Reveal delay={100} className="bg-white border border-[var(--line)] p-8 flex flex-col gap-3">
              <div className="w-11 h-11 rounded-full bg-[var(--dark)] text-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" />
                </svg>
              </div>
              <h3 className="font-display text-lg">Instagram</h3>
              <a href="https://instagram.com/blackk.detail" target="_blank" rel="noopener noreferrer" className="btn btn-dark self-start border">Ver perfil</a>
            </Reveal>
            <Reveal delay={200} className="bg-white border border-[var(--line)] p-8 flex flex-col gap-3">
              <div className="w-11 h-11 rounded-full bg-[var(--dark)] text-white flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M3 6h18v12H3z" /><path d="M3 7l9 6 9-6" />
                </svg>
              </div>
              <h3 className="font-display text-lg">Email</h3>
              <a href="mailto:blackkdetail@gmail.com" className="btn btn-dark self-start border">Enviar mail</a>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[var(--dark)] text-gray-400 py-10 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center flex-wrap gap-4 pb-6 border-b border-white/10 mb-5">
            <span className="text-white font-display text-lg">Blackk Detail</span>
          </div>
          <div className="flex justify-between flex-wrap gap-2 text-xs">
            <span>Productos para detailing y cuidado automotor.</span>
            <span>WhatsApp +54 3492 270506 · blackkdetail@gmail.com · @blackk.detail</span>
          </div>
        </div>
      </footer>

      {/* BOTÓN FLOTANTE WHATSAPP */}
      
       <a href={genericWa}
        target="_blank"
        rel="noopener noreferrer"
        className="wsp-float"
        aria-label="Consultar por WhatsApp"
      >
        <WspIcon className="w-7 h-7" />
      </a>

      {/* MODAL DETALLE */}
      {selected && (
        <div
          className="modal-overlay fixed inset-0 bg-black/70 flex items-center justify-center p-5 z-[200]"
          onClick={() => setSelected(null)}
        >
          <div
            className="modal-panel bg-white max-w-2xl w-full grid md:grid-cols-2 relative max-h-[88vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
              aria-label="Cerrar"
            >
              ✕
            </button>
            <div className="bg-[#EAE8E2] min-h-[260px]">
              <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-8 flex flex-col gap-3">
              <span className="bg-[var(--dark)] text-white text-[10px] font-semibold px-2 py-1 rounded-full uppercase w-fit">
                {selected.category}
              </span>
              <h3 className="font-display text-2xl">{selected.name}</h3>
              <div className="font-display text-3xl font-semibold">{priceFmt.format(selected.price)}</div>
              <p className="text-sm text-[var(--ink-soft)] border-t border-[var(--line)] pt-4">
                Este producto forma parte del catálogo de Blackk Detail. Para conocer disponibilidad y coordinar la compra, consultá directamente por WhatsApp.
              </p>
              
                <a href={waLink(productWaText(selected.name))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-wsp mt-auto"
              >
                <WspIcon className="w-4 h-4" /> Consultar por WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}