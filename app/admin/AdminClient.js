'use client';

import { useEffect, useState } from 'react';

const priceFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function AdminClient() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetch('/api/admin/check')
      .then(r => r.json())
      .then(d => setAuthorized(!!d.authorized))
      .catch(() => setAuthorized(false))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!authorized) return;
    loadProducts();
  }, [authorized]);

  function loadProducts() {
    setLoadingProducts(true);
    fetch('/api/products')
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoadingProducts(false));
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      setAuthorized(true);
    } else {
      setLoginError('Clave incorrecta.');
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthorized(false);
  }

  function handleFileChange(e) {
    const f = e.target.files[0];
    setFile(f || null);
    if (f) {
      const reader = new FileReader();
      reader.onload = ev => setPreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview('');
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setName(p.name);
    setPrice(String(p.price));
    // Si la categoría del producto ya está en la lista, la seleccionamos tal cual;
    // si no (caso raro), la tratamos como "otra categoría".
    setCategory(p.category);
    setCustomCategory('');
    setFile(null);
    setPreview(p.image);
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setName('');
    setPrice('');
    setCategory('');
    setCustomCategory('');
    setFile(null);
    setPreview('');
    setFormError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    const finalCategory = category === '__other__' ? customCategory.trim() : category;

    if (!name.trim() || !price || !finalCategory) {
      setFormError('Completá nombre, precio y categoría.');
      return;
    }
    if (!editingId && !file) {
      setFormError('Elegí una imagen para el producto nuevo.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('price', price);
      formData.append('category', finalCategory);
      if (file) formData.append('image', file);

      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'No se pudo guardar el producto.');
        return;
      }
      cancelEdit();
      loadProducts();
    } catch (err) {
      setFormError('Error de red al guardar el producto.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id, productName) {
    if (!confirm(`¿Eliminar "${productName}" del catálogo?`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      if (editingId === id) cancelEdit();
      loadProducts();
    } else {
      alert('No se pudo eliminar el producto.');
    }
  }

  const categories = Array.from(new Set(products.map(p => p.category)));

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-[var(--ink-soft)]">Cargando...</div>;
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
        <form onSubmit={handleLogin} className="bg-white border border-[var(--line)] p-8 max-w-sm w-full">
          <h1 className="font-display text-2xl mb-1">Panel administrador</h1>
          <p className="text-sm text-[var(--ink-soft)] mb-6">Blackk Detail</p>
          <label className="text-xs font-semibold text-[var(--ink-soft)] block mb-2">Clave de acceso</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-[var(--line)] px-3 py-2.5 mb-3"
            autoFocus
          />
          {loginError && <p className="text-red-600 text-sm mb-3">{loginError}</p>}
          <button type="submit" className="btn btn-primary w-full !bg-[var(--dark)] !text-white">Ingresar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-2xl">Panel administrador</h1>
            <p className="text-sm text-[var(--ink-soft)]">Blackk Detail</p>
          </div>
          <button onClick={handleLogout} className="btn-dark border text-sm px-4 py-2">Cerrar sesión</button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[var(--line)] p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{editingId ? 'Editar producto' : 'Agregar producto'}</h2>
            {editingId && (
              <button type="button" onClick={cancelEdit} className="text-xs text-[var(--ink-soft)] underline">
                Cancelar edición
              </button>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <label className="text-xs font-semibold text-[var(--ink-soft)] flex flex-col gap-1.5">
              Nombre
              <input value={name} onChange={e => setName(e.target.value)} className="border border-[var(--line)] px-3 py-2 font-normal text-[var(--ink)]" />
            </label>
            <label className="text-xs font-semibold text-[var(--ink-soft)] flex flex-col gap-1.5">
              Precio (ARS)
              <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className="border border-[var(--line)] px-3 py-2 font-normal text-[var(--ink)]" />
            </label>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <label className="text-xs font-semibold text-[var(--ink-soft)] flex flex-col gap-1.5">
              Categoría
              <select value={category} onChange={e => setCategory(e.target.value)} className="border border-[var(--line)] px-3 py-2 font-normal text-[var(--ink)]">
                <option value="">Elegir...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__other__">Otra categoría...</option>
              </select>
            </label>
            {category === '__other__' && (
              <label className="text-xs font-semibold text-[var(--ink-soft)] flex flex-col gap-1.5">
                Nueva categoría
                <input value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="border border-[var(--line)] px-3 py-2 font-normal text-[var(--ink)]" />
              </label>
            )}
          </div>
          <label className="text-xs font-semibold text-[var(--ink-soft)] flex flex-col gap-1.5 mb-3">
            Imagen del producto {editingId && <span className="font-normal normal-case">(dejá vacío para mantener la actual)</span>}
            <input type="file" accept="image/*" onChange={handleFileChange} className="font-normal text-[var(--ink)] text-sm" />
          </label>
          {preview && <img src={preview} alt="preview" className="w-28 h-28 object-cover border border-[var(--line)] mb-3" />}
          {formError && <p className="text-red-600 text-sm mb-3">{formError}</p>}
          <button type="submit" disabled={submitting} className="btn btn-primary !bg-[var(--dark)] !text-white">
            {submitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar producto'}
          </button>
        </form>

        <div className="bg-white border border-[var(--line)] p-6">
          <h2 className="font-semibold mb-4">Productos actuales ({products.length})</h2>
          {loadingProducts ? (
            <p className="text-sm text-[var(--ink-soft)]">Cargando...</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[420px] overflow-auto">
              {products.map(p => (
                <div key={p.id} className={`flex items-center gap-3 border p-2 ${editingId === p.id ? 'border-[var(--dark)]' : 'border-[var(--line)]'}`}>
                  <img src={p.image} alt={p.name} className="w-11 h-11 object-cover rounded-sm bg-[#EAE8E2]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-[var(--ink-soft)]">{priceFmt.format(p.price)} · {p.category}</p>
                  </div>
                  <button
                    onClick={() => startEdit(p)}
                    className="px-3 py-1.5 text-xs font-semibold border border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--dark)] hover:text-white hover:border-[var(--dark)]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="w-7 h-7 rounded-full border border-[var(--line)] text-[var(--ink-soft)] hover:bg-red-600 hover:text-white hover:border-red-600"
                    title="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}