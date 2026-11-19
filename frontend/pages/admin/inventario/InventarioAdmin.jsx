// ============================================================================
// ADMIN: INVENTARIO DE SERVICIOS Y PRODUCTOS (Crear y actualizar stock/precios)
// ============================================================================
import { useEffect, useState } from 'react';
import { apiFetch } from '../../../services/api';

export default function InventarioAdmin() {
  const [productos, setProductos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [mensaje, setMensaje] = useState('');

  // Formulario nuevo producto o edición de producto existente
  const [editandoId, setEditandoId] = useState(null);
  const [nombreProd, setNombreProd] = useState('');
  const [catProd, setCatProd] = useState('aceites');
  const [precioProd, setPrecioProd] = useState('');
  const [stockProd, setStockProd] = useState('10');
  const [descripcionProd, setDescripcionProd] = useState('');
  const [imagenUrlExistente, setImagenUrlExistente] = useState('');
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargar();
  }, []);

  function cargar() {
    apiFetch('/productos?incluirInactivos=1').then((res) => setProductos(res.productos || []));
    apiFetch('/servicios?incluirInactivos=1').then((res) => setServicios(res.servicios || []));
  }

  // Convierte el archivo seleccionado a base64 para enviarlo al backend
  function leerArchivoBase64(archivo) {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result);
      lector.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
      lector.readAsDataURL(archivo);
    });
  }

  function manejarCambioFoto(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setArchivoFoto(archivo);
    setPreviewFoto(URL.createObjectURL(archivo)); // Vista previa inmediata en el navegador
  }

  function limpiarFormularioProducto() {
    setEditandoId(null);
    setNombreProd('');
    setCatProd('aceites');
    setPrecioProd('');
    setStockProd('10');
    setDescripcionProd('');
    setImagenUrlExistente('');
    setArchivoFoto(null);
    setPreviewFoto('');
  }

  function cargarProductoParaEditar(prod) {
    setEditandoId(prod.id);
    setNombreProd(prod.nombre || '');
    setCatProd(prod.categoria || 'aceites');
    setPrecioProd(String(prod.precio ?? ''));
    setStockProd(String(prod.stock ?? '0'));
    setDescripcionProd(prod.descripcion || '');
    setImagenUrlExistente(prod.imagen_url || '');
    setArchivoFoto(null);
    setPreviewFoto(prod.imagen_url || '');
    setError('');
    setMensaje('');
  }

  async function guardarProducto(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setSubiendo(true);

    try {
      let imagenUrlFinal = imagenUrlExistente || null;

      // Si el administrador eligió una foto nueva, la subimos primero al servidor
      if (archivoFoto) {
        const datosBase64 = await leerArchivoBase64(archivoFoto);
        const resImg = await apiFetch('/productos/subir-imagen', {
          method: 'POST',
          body: JSON.stringify({ datosBase64 })
        });
        imagenUrlFinal = resImg.imagen_url;
      }

      const payload = {
        nombre: nombreProd,
        categoria: catProd,
        descripcion: descripcionProd,
        precio: Number(precioProd),
        stock: Number(stockProd),
        imagen_url: imagenUrlFinal,
        activo: true
      };

      if (editandoId) {
        await apiFetch(`/productos/${editandoId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setMensaje('Producto actualizado correctamente.');
      } else {
        await apiFetch('/productos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setMensaje('Producto añadido al inventario.');
      }

      limpiarFormularioProducto();
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  }

  async function eliminarProducto(prod) {
    if (!window.confirm(`¿Seguro que quieres eliminar "${prod.nombre}" de la tienda?`)) return;
    setError('');
    setMensaje('');
    try {
      const res = await apiFetch(`/productos/${prod.id}`, { method: 'DELETE' });
      if (editandoId === prod.id) limpiarFormularioProducto();
      setMensaje(res.mensaje);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function ajustarStock(prod, delta) {
    const nuevoStock = Math.max(0, prod.stock + delta);
    await apiFetch(`/productos/${prod.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...prod, stock: nuevoStock })
    });
    cargar();
  }

  return (
    <div>
      {error && <div className="alerta-error">{error}</div>}
      {mensaje && <div className="alerta-exito">{mensaje}</div>}

      <div className="grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
        <div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem' }}>Stock de Productos</h2>
          <form onSubmit={guardarProducto} className="tarjeta" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
              {editandoId ? 'Editar producto' : 'Añadir nuevo producto'}
            </h3>
            <div className="campo">
              <label>Nombre</label>
              <input type="text" required value={nombreProd} onChange={(e) => setNombreProd(e.target.value)} />
            </div>
            <div className="campo">
              <label>Descripción (opcional)</label>
              <textarea rows={2} placeholder="Beneficios, aroma o uso recomendado..." value={descripcionProd} onChange={(e) => setDescripcionProd(e.target.value)} />
            </div>
            <div className="grid-3">
              <div className="campo">
                <label>Categoría</label>
                <select value={catProd} onChange={(e) => setCatProd(e.target.value)}>
                  <option value="aceites">Aceites</option>
                  <option value="cremas">Cremas</option>
                  <option value="infusiones">Infusiones</option>
                  <option value="especias">Especias</option>
                  <option value="libros">Libros</option>
                </select>
              </div>
              <div className="campo">
                <label>Precio (€)</label>
                <input type="number" step="0.01" required value={precioProd} onChange={(e) => setPrecioProd(e.target.value)} />
              </div>
              <div className="campo">
                <label>Stock</label>
                <input type="number" required value={stockProd} onChange={(e) => setStockProd(e.target.value)} />
              </div>
            </div>

            <div className="campo">
              <label>Foto del producto</label>
              <input type="file" accept="image/*" onChange={manejarCambioFoto} />
              {previewFoto && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={previewFoto}
                    alt="Vista previa"
                    style={{ width: 68, height: 68, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--borde-suave)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-suave"
                    style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                    onClick={() => {
                      setArchivoFoto(null);
                      setPreviewFoto('');
                      setImagenUrlExistente('');
                    }}
                  >
                    Quitar foto
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primario" disabled={subiendo}>
                {subiendo ? 'Guardando...' : editandoId ? 'Actualizar producto' : 'Guardar producto'}
              </button>
              {editandoId && (
                <button type="button" className="btn btn-suave" onClick={limpiarFormularioProducto}>
                  Cancelar edición
                </button>
              )}
            </div>
          </form>

          {productos.map((p) => (
            <div key={p.id} className="tarjeta" style={{ padding: '0.9rem 1rem', marginBottom: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', opacity: p.activo ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {p.imagen_url && (
                  <img
                    src={p.imagen_url}
                    alt={p.nombre}
                    style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                  />
                )}
                <div>
                  <strong>{p.nombre}</strong> {!p.activo && <small style={{ color: 'var(--error)' }}>(Retirado)</small>}
                  <div style={{ fontSize: '0.84rem', color: 'var(--texto-suave)' }}>
                    {p.categoria} · {Number(p.precio).toFixed(2)} € · Stock: <strong>{p.stock}</strong>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-suave" style={{ padding: '0.3rem 0.65rem' }} onClick={() => ajustarStock(p, -1)}>-</button>
                <button type="button" className="btn btn-suave" style={{ padding: '0.3rem 0.65rem' }} onClick={() => ajustarStock(p, 1)}>+</button>
                <button type="button" className="btn btn-salvia" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => cargarProductoParaEditar(p)}>Editar</button>
                <button type="button" className="btn btn-contorno" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => eliminarProducto(p)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem' }}>Servicios Activos</h2>
          {servicios.map((s) => (
            <div key={s.id} className="tarjeta" style={{ padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{s.nombre}</strong>
                <strong style={{ color: 'var(--terracota)' }}>{Number(s.precio).toFixed(2)} €</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
                {s.duracion_minutos} min + {s.margen_descanso_minutos} min descanso · {s.modalidad}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
