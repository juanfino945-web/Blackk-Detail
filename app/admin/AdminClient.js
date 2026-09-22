'use client';

import { useEffect, useRef, useState } from 'react';

const priceFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

function cleanPrice(raw) {
  if (typeof raw === 'number') return raw;
  if (!raw) return NaN;
  let str = String(raw).trim().replace(/[$ \s]/g, '');
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length === 3) {
      str = str.replace(',', '');
    } else {
      str = str.replace(',', '.');
    }
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      str = str.replace('.', '');
    }
  }
  return parseFloat(str);
}

export default function AdminClient() {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [categoryList, setCategoryList] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [imageMode, setImageMode] = useState('file'); // 'file' | 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef(null);

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
    loadCategories();
  }, [authorized]);

  function loadProducts() {
    setLoadingProducts(true);
    fetch(`/api/products?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.products)) {
          setProducts(d.products);
        }
      })
      .catch(err => console.error('Error cargando productos:', err))
      .finally(() => setLoadingProducts(false));
  }

  function loadCategories() {
    fetch('/api/admin/categories', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.categories)) setCategoryList(d.categories);
      })
      .catch(err => console.error('Error cargando categorías:', err));
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

  async function handleAddCategory(e) {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    setCategorySubmitting(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.category) {
        setCategoryList(prev => {
          if (prev.some(c => c.name === data.category.name)) return prev;
          return [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name));
        });
        setNewCategoryName('');
      } else {
        alert(data.error || 'No se pudo agregar la categoría.');
      }
    } catch (err) {
      alert('Error de red al agregar la categoría.');
    } finally {
      setCategorySubmitting(false);
    }
  }

  async function handleDeleteCategory(id, catName) {
    if (!confirm(`¿Eliminar la categoría "${catName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCategoryList(prev => prev.filter(c => c.id !== id));
        setSuccessMsg(`Categoría "${catName}" eliminada.`);
      } else {
        alert(data.error || 'No se pudo eliminar la categoría.');
      }
    } catch (err) {
      alert('Error de red al eliminar la categoría.');
    }
  }

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
    if (f) {
      const reader = new FileReader();
      reader.onload = ev => setPreview(ev.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(imageUrl || '');
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setName(p.name);
    setPrice(String(p.price));
    setCategory(p.category);
    setCustomCategory('');
    setFile(null);
    setImageUrl(p.image || '');
    setPreview(p.image || '');
    setImageMode('file');
    setFormError('');
    setSuccessMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setName('');
    setPrice('');
    setCategory('');
    setCustomCategory('');
    setFile(null);
    setImageUrl('');
    setPreview('');
    setImageMode('file');
    setFormError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');
    const finalCategory = category === '__other__' ? customCategory.trim() : category;
    const numPrice = cleanPrice(price);

    if (!name.trim() || isNaN(numPrice) || numPrice < 0 || !finalCategory) {
      setFormError('Por favor completá nombre, precio numérico válido y categoría.');
      return;
    }

    if (!editingId && !file && !imageUrl.trim()) {
      setFormError('Debes seleccionar una imagen para el producto nuevo (archivo o enlace URL).');
      return;
    }

    setSubmitting(true);
    try {
      // Si es una categoría nueva escrita a mano, la guardamos también en la
      // tabla de categorías para que quede disponible como opción a futuro.
      if (category === '__other__' && finalCategory && !categoryList.some(c => c.name === finalCategory)) {
        try {
          const catRes = await fetch('/api/admin/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: finalCategory })
          });
          const catData = await catRes.json().catch(() => ({}));
          if (catRes.ok && catData.category) {
            setCategoryList(prev => {
              if (prev.some(c => c.name === catData.category.name)) return prev;
              return [...prev, catData.category].sort((a, b) => a.name.localeCompare(b.name));
            });
          }
        } catch (e) {
          // no bloquea el guardado del producto si esto falla
        }
      }

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('price', String(numPrice));
      formData.append('category', finalCategory);

      if (file) {
        formData.append('image', file);
      } else if (imageUrl.trim()) {
        formData.append('imageUrl', imageUrl.trim());
      }

      const url = editingId ? `/api/admin/products/${editingId}` : '/api/admin/products';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, body: formData });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'No se pudo guardar el producto.');
        return;
      }

      if (data.product) {
        if (editingId) {
          setProducts(prev => prev.map(p => p.id === data.product.id ? data.product : p));
          setSuccessMsg(`Producto "${data.product.name}" editado con éxito.`);
        } else {
          setProducts(prev => [data.product, ...prev]);
          setSuccessMsg(`Producto "${data.product.name}" agregado con éxito.`);
        }
      }

      cancelEdit();
      loadProducts();
    } catch (err) {
      setFormError('Error de red al guardar el producto. Verificá tu conexión.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id, productName) {
    if (!confirm(`¿Eliminar "${productName}" del catálogo?`)) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        setSuccessMsg(`Producto "${productName}" eliminado con éxito.`);
        if (editingId === id) cancelEdit();
        loadProducts();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'No se pudo eliminar el producto.');
      }
    } catch (err) {
      alert('Error de red al eliminar el producto.');
    }
  }

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
          <div className="flex gap-2">
            <a href="/" className="px-3 py-1.5 text-xs font-medium border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-gray-50 flex items-center">
              Ver tienda
            </a>
            <button onClick={handleLogout} className="btn-dark border text-sm px-4 py-2">Cerrar sesión</button>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm rounded-sm flex justify-between items-center">
            <span>✓ {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-700 font-bold ml-4">✕</button>
          </div>
        )}

        <div className="bg-white border border-[var(--line)] p-6 mb-8">
          <h2 className="font-semibold mb-4">Categorías ({categoryList.length})</h2>
          <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
            <input
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              placeholder="Nueva categoría..."
              className="flex-1 border border-[var(--line)] px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={categorySubmitting || !newCategoryName.trim()}
              className="btn-dark border text-sm px-4 py-2 disabled:opacity-50"
            >
              Agregar
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {categoryList.map(c => (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 bg-[var(--bg)] border border-[var(--line)] text-xs font-medium px-3 py-1.5 rounded-full"
              >
                {c.name}
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c.id, c.name)}
                  className="text-[var(--ink-soft)] hover:text-red-600 font-bold"
                  title="Eliminar categoría"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className={`bg-white border p-6 mb-8 transition-colors ${editingId ? 'border-[var(--steel)] shadow-sm' : 'border-[var(--line)]'}`}>
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--line)]">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${editingId ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <h2 className="font-semibold text-lg">{editingId ? 'Editar producto' : 'Agregar nuevo producto'}</h2>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded border border-gray-300"
              >
                Cancelar edición / Agregar nuevo
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <label className="text-xs font-semibold text-[var(--ink-soft)] flex flex-col gap-1.5">
              Nombre del producto *
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Cera Blend Ceramic"
                className="border border-[var(--line)] px-3 py-2 font-normal text-[var(--ink)]"
                required
              />
            </label>
            <label className="text-xs font-semibold text-[var(--ink-soft)] flex flex-col gap-1.5">
              Precio (ARS) *
              <input
                type="text"
                inputMode="decimal"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="Ej: 9150"
                className="border border-[var(--line)] px-3 py-2 font-normal text-[var(--ink)]"
                required
              />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <label className="text-xs font-semibold text-[var(--ink-soft)] flex flex-col gap-1.5">
              Categoría *
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="border border-[var(--line)] px-3 py-2 font-normal text-[var(--ink)]"
                required
              >
                <option value="">Elegir categoría...</option>
                {categoryList.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                <option value="__other__">+ Otra categoría personalizada...</option>
              </select>
            </label>
            {category === '__other__' && (
              <label className="text-xs font-semibold text-[var(--ink-soft)] flex flex-col gap-1.5">
                Nombre de la nueva categoría *
                <input
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="Ej: Microfibras"
                  className="border border-[var(--line)] px-3 py-2 font-normal text-[var(--ink)]"
                  required
                />
              </label>
            )}
          </div>

          <div className="border-t border-[var(--line)] pt-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--ink-soft)]">
                Imagen {editingId && <span className="font-normal text-gray-500">(opcional si no deseás cambiarla)</span>}
              </label>
              <div className="text-xs flex gap-3 text-gray-600">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="imageMode"
                    value="file"
                    checked={imageMode === 'file'}
                    onChange={() => setImageMode('file')}
                  />
                  Subir archivo
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="imageMode"
                    value="url"
                    checked={imageMode === 'url'}
                    onChange={() => setImageMode('url')}
                  />
                  Pegar URL
                </label>
              </div>
            </div>

            {imageMode === 'file' ? (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="font-normal text-[var(--ink)] text-sm w-full border border-[var(--line)] p-2"
              />
            ) : (
              <input
                type="url"
                value={imageUrl}
                onChange={e => {
                  setImageUrl(e.target.value);
                  setPreview(e.target.value);
                }}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="border border-[var(--line)] px-3 py-2 font-normal text-[var(--ink)] text-sm w-full"
              />
            )}
          </div>

          {preview && (
            <div className="mb-4 flex items-center gap-3 bg-gray-50 p-2 border border-[var(--line)]">
              <img src={preview} alt="Vista previa" className="w-20 h-20 object-cover border border-[var(--line)] bg-white" />
              <div className="text-xs text-gray-600">
                <p className="font-semibold">Vista previa de la imagen</p>
                {file && <p>Archivo: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
              </div>
            </div>
          )}

          {formError && <p className="text-red-600 text-sm mb-4 font-medium p-2 bg-red-50 border border-red-200">{formError}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary !bg-[var(--dark)] !text-white px-6 py-2.5 font-medium disabled:opacity-50"
            >
              {submitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar producto'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 text-xs font-semibold border border-[var(--line)] text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="bg-white border border-[var(--line)] p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Productos en catálogo ({products.length})</h2>
            <button
              onClick={loadProducts}
              className="text-xs text-[var(--ink-soft)] hover:text-black flex items-center gap-1 underline"
            >
              🔄 Actualizar lista
            </button>
          </div>
          {loadingProducts && products.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)] py-6 text-center">Cargando productos...</p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[500px] overflow-auto">
              {products.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 border p-3 transition-colors ${editingId === p.id ? 'border-[var(--steel)] bg-slate-50' : 'border-[var(--line)] hover:border-gray-400'}`}
                >
                  <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-sm bg-[#EAE8E2]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-[var(--ink)]">{p.name}</p>
                    <p className="text-xs text-[var(--ink-soft)]">{priceFmt.format(p.price)} · <span className="font-medium">{p.category}</span></p>
                  </div>
                  <button
                    onClick={() => startEdit(p)}
                    className="px-3 py-1.5 text-xs font-semibold border border-[var(--line)] text-[var(--ink-soft)] hover:bg-[var(--dark)] hover:text-white hover:border-[var(--dark)]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    className="w-7 h-7 rounded-full border border-[var(--line)] text-[var(--ink-soft)] hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center font-bold"
                    title="Eliminar producto"
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