// ============================================================================
// PÁGINA DEDICADA DE COMPRA DE BONOS DE SESIONES (/bonos)
// ============================================================================
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BonosPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [servicios, setServicios] = useState([]);
  const [servicioId, setServicioId] = useState('');
  const [sesiones, setSesiones] = useState(5);
  const [metodoPago, setMetodoPago] = useState('tarjeta');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/servicios')
      .then((res) => {
        const lista = res.servicios || [];
        setServicios(lista);
        if (lista.length > 0) setServicioId(String(lista[0].id));
      })
      .catch(() => {});
  }, []);

  const servicioActual = servicios.find((s) => String(s.id) === servicioId);
  const descuento = sesiones === 10 ? 0.15 : sesiones === 5 ? 0.10 : 0.05;
  const precioBase = servicioActual ? Number(servicioActual.precio) * sesiones : 0;
  const precioFinal = Number((precioBase * (1 - descuento)).toFixed(2));

  async function comprarBono(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    if (!usuario) {
      navigate('/mi-cuenta', { state: { aviso: 'Inicia sesión o regístrate para comprar un Bono de Sesiones.' } });
      return;
    }

    try {
      const res = await apiFetch('/clientes/bonos/comprar', {
        method: 'POST',
        body: JSON.stringify({
          servicio_id: Number(servicioId),
          sesiones,
          metodo_pago: metodoPago
        })
      });
      setMensaje(res.mensaje);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="seccion">
      <div className="contenedor" style={{ maxWidth: '820px' }}>
        <span className="etiqueta" style={{ marginBottom: '0.6rem' }}>Ahorro y Continuidad</span>
        <h1 style={{ fontSize: '2.7rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Ticket size={30} color="var(--terracota)" /> Bonos de Sesiones
        </h1>
        <p style={{ color: 'var(--texto-suave)', marginBottom: '2rem' }}>
          Compra tu bono de 3, 5 o 10 sesiones con descuento directo. Se añadirá al instante a tu cuenta para canjearlo cuando reserves cita.
        </p>

        <div className="tarjeta" style={{ padding: '2rem', background: '#fdf8f2' }}>
          {error && <div className="alerta-error">{error}</div>}
          {mensaje ? (
            <div className="alerta-exito">
              <p style={{ marginBottom: '0.8rem' }}>{mensaje}</p>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <Link to="/reservar" className="btn btn-primario">Reservar cita ahora</Link>
                <button type="button" className="btn btn-suave" onClick={() => setMensaje('')}>Comprar otro bono</button>
              </div>
            </div>
          ) : (
            <form onSubmit={comprarBono}>
              <div className="campo">
                <label>Elige la terapia</label>
                <select value={servicioId} onChange={(e) => setServicioId(e.target.value)}>
                  {servicios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({Number(s.precio).toFixed(2)} € / sesión)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="campo">
                  <label>Número de sesiones</label>
                  <select value={sesiones} onChange={(e) => setSesiones(Number(e.target.value))}>
                    <option value={3}>3 sesiones (5% dto.)</option>
                    <option value={5}>5 sesiones (10% dto.)</option>
                    <option value={10}>10 sesiones (15% dto.)</option>
                  </select>
                </div>
                <div className="campo">
                  <label>Método de pago</label>
                  <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                    <option value="tarjeta">Tarjeta (Stripe)</option>
                    <option value="bizum">Bizum</option>
                  </select>
                </div>
              </div>

              {servicioActual && (
                <div style={{ margin: '0.75rem 0 1.25rem', padding: '0.9rem 1rem', borderRadius: 10, background: '#fff', border: '1px solid var(--borde-suave)' }}>
                  <span style={{ color: 'var(--texto-suave)', textDecoration: 'line-through', marginRight: '0.6rem' }}>
                    {precioBase.toFixed(2)} €
                  </span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--terracota)' }}>
                    {precioFinal.toFixed(2)} €
                  </strong>
                  <small style={{ marginLeft: '0.5rem', color: 'var(--salvia)', fontWeight: 600 }}>
                    (Ahorras {(precioBase - precioFinal).toFixed(2)} €)
                  </small>
                </div>
              )}

              <button type="submit" className="btn btn-primario">
                {usuario ? `Comprar Bono (${precioFinal.toFixed(2)} €)` : 'Inicia sesión para comprar bono'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
