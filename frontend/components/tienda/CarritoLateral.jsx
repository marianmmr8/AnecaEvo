// ============================================================================
// CARRITO LATERAL DESPLEGABLE (Con finalización de compra y descuento de stock)
// ============================================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';

export default function CarritoLateral() {
  const { items, abierto, setAbierto, cambiarCantidad, vaciarCarrito, totalPrecio } = useCart();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [nombreEnvio, setNombreEnvio] = useState('');
  const [telefonoEnvio, setTelefonoEnvio] = useState('');
  const [emailEnvio, setEmailEnvio] = useState('');
  const [direccion, setDireccion] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [comentarioEnvio, setComentarioEnvio] = useState('');
  const [metodoPago, setMetodoPago] = useState('tarjeta');
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  if (!abierto) return null;

  async function finalizarCompra(e) {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (!usuario) {
      setAbierto(false);
      navigate('/mi-cuenta');
      return;
    }

    setProcesando(true);
    try {
      const notaTexto = comentarioEnvio.trim() ? ` · Nota: ${comentarioEnvio.trim()}` : '';
      const direccionCompleta = `${nombreEnvio.trim()} · Tel: ${telefonoEnvio.trim()} · Email: ${emailEnvio.trim()} · ${direccion.trim()}, ${codigoPostal.trim()} ${ciudad.trim()}${notaTexto}`;
      const payload = {
        items: items.map((i) => ({ producto_id: i.producto.id, cantidad: i.cantidad })),
        direccion_envio: direccionCompleta,
        metodo_pago: metodoPago
      };
      const res = await apiFetch('/pedidos', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setMensaje(res.mensaje);
      vaciarCarrito();
      setNombreEnvio('');
      setTelefonoEnvio('');
      setEmailEnvio('');
      setDireccion('');
      setCodigoPostal('');
      setCiudad('');
      setComentarioEnvio('');
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(46, 42, 39, 0.45)', display: 'flex', justifyContent: 'flex-end'
      }}
      onClick={() => setAbierto(false)}
    >
      <aside
        style={{
          width: 'min(420px, 100%)', height: '100%', background: 'var(--bg-crema)',
          padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={20} /> Tu Cesta Natural
            </h3>
            <button type="button" className="icono-btn" onClick={() => setAbierto(false)}>
              <X size={18} />
            </button>
          </div>

          {error && <div className="alerta-error">{error}</div>}
          {mensaje && <div className="alerta-exito">{mensaje}</div>}

          {items.length === 0 ? (
            <p style={{ color: 'var(--texto-suave)', padding: '2rem 0', textAlign: 'center' }}>
              Tu cesta está vacía. Explora nuestros aceites, infusiones y libros.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {items.map(({ producto, cantidad }) => (
                <div
                  key={producto.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: '0.8rem', borderBottom: '1px solid var(--borde-suave)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{producto.nombre}</strong>
                    <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
                      {Number(producto.precio).toFixed(2)} € / ud
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button type="button" className="icono-btn" style={{ width: 28, height: 28 }} onClick={() => cambiarCantidad(producto.id, -1)}>
                      <Minus size={14} />
                    </button>
                    <span>{cantidad}</span>
                    <button type="button" className="icono-btn" style={{ width: 28, height: 28 }} onClick={() => cambiarCantidad(producto.id, 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <form onSubmit={finalizarCompra} style={{ marginTop: '1.5rem', borderTop: '1px solid var(--borde-suave)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', marginBottom: '1rem' }}>
              <span>Total</span>
              <strong style={{ color: 'var(--terracota)' }}>{totalPrecio.toFixed(2)} €</strong>
            </div>

            <div className="campo">
              <label>Nombre completo (solo letras)</label>
              <input
                type="text"
                required
                placeholder="Nombre y apellidos"
                value={nombreEnvio}
                onChange={(e) => setNombreEnvio(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, ''))}
              />
            </div>

            <div className="grid-2" style={{ gap: '0.6rem' }}>
              <div className="campo">
                <label>Teléfono</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  pattern="[0-9+]{9,15}"
                  placeholder="600111222"
                  value={telefonoEnvio}
                  onChange={(e) => setTelefonoEnvio(e.target.value.replace(/[^0-9+]/g, ''))}
                />
              </div>
              <div className="campo">
                <label>Email</label>
                <input type="email" required placeholder="tu@email.com" value={emailEnvio} onChange={(e) => setEmailEnvio(e.target.value)} />
              </div>
            </div>

            <div className="campo">
              <label>Dirección completa</label>
              <input
                type="text"
                required
                pattern=".*[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+.*"
                title="Introduce una dirección válida con el nombre de la calle"
                placeholder="Calle, número, piso, puerta..."
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
            </div>

            <div className="grid-2" style={{ gap: '0.6rem' }}>
              <div className="campo">
                <label>Código Postal (5 números)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={5}
                  pattern="[0-9]{5}"
                  placeholder="28001"
                  value={codigoPostal}
                  onChange={(e) => setCodigoPostal(e.target.value.replace(/\D/g, '').slice(0, 5))}
                />
              </div>
              <div className="campo">
                <label>Ciudad / Provincia (solo letras)</label>
                <input
                  type="text"
                  required
                  placeholder="Madrid"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, ''))}
                />
              </div>
            </div>

            <div className="campo">
              <label>Comentario para el envío (opcional)</label>
              <textarea
                rows={2}
                placeholder="Ej: Dejar en portería, envolver para regalo..."
                value={comentarioEnvio}
                onChange={(e) => setComentarioEnvio(e.target.value)}
              />
            </div>

            <div className="campo">
              <label>Método de pago</label>
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                <option value="tarjeta">Tarjeta (Stripe)</option>
                <option value="bizum">Bizum</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primario" style={{ width: '100%' }} disabled={procesando}>
              {procesando ? 'Procesando pedido...' : usuario ? 'Confirmar y Pagar' : 'Inicia sesión para comprar'}
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}
