// ============================================================================
// PÁGINA MI CUENTA (Login, Registro, Mis Citas con regla 24h, Mis Pedidos y Bonos)
// ============================================================================
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogOut, Calendar, Package, Ticket } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function MiCuentaPage() {
  const { usuario, guardarSesion, cerrarSesion } = useAuth();
  const [modoRegistro, setModoRegistro] = useState(false);

  // Estados de formulario auth
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefono, setTelefono] = useState('');

  // Datos del área privada del cliente
  const [citas, setCitas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [bonos, setBonos] = useState([]);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (!usuario || usuario.rol === 'admin') return;
    cargarDatosCliente();
  }, [usuario]);

  function cargarDatosCliente() {
    Promise.all([
      apiFetch('/citas/mias'),
      apiFetch('/pedidos/mios'),
      apiFetch('/clientes/bonos/mios')
    ])
      .then(([resCitas, resPedidos, resBonos]) => {
        setCitas(resCitas.citas || []);
        setPedidos(resPedidos.pedidos || []);
        setBonos(resBonos.bonos || []);
      })
      .catch(() => {});
  }

  async function enviarAuth(e) {
    e.preventDefault();
    setError('');
    try {
      const ruta = modoRegistro ? '/auth/registro' : '/auth/login';
      const body = modoRegistro
        ? { nombre, apellidos, email, password, telefono }
        : { email, password };
      const res = await apiFetch(ruta, { method: 'POST', body: JSON.stringify(body) });
      guardarSesion(res.token, res.usuario);
    } catch (err) {
      setError(err.message);
    }
  }

  async function cancelarMiCita(id) {
    setError('');
    setMensaje('');
    try {
      const res = await apiFetch(`/citas/${id}/cancelar`, { method: 'PATCH' });
      setMensaje(res.mensaje);
      cargarDatosCliente();
    } catch (err) {
      setError(err.message);
    }
  }

  // Si el usuario es administrador, entra directamente al Panel Admin (sin mostrar citas ni pedidos propios)
  if (usuario?.rol === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (!usuario) {
    return (
      <div className="seccion">
        <div className="contenedor" style={{ maxWidth: '480px' }}>
          <div className="tarjeta" style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>
              {modoRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
            </h1>
            <p style={{ color: 'var(--texto-suave)', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
              {modoRegistro
                ? 'Únete a Aneca Evo para gestionar tus citas, bonos y pedidos.'
                : 'Accede a tus citas, bonos de sesiones y pedidos.'}
            </p>

            {error && <div className="alerta-error">{error}</div>}

            <form onSubmit={enviarAuth}>
              {modoRegistro && (
                <>
                  <div className="campo">
                    <label>Nombre</label>
                    <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
                  </div>
                  <div className="campo">
                    <label>Apellidos</label>
                    <input type="text" required value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
                  </div>
                  <div className="campo">
                    <label>Teléfono (para recordatorios WhatsApp)</label>
                    <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                  </div>
                </>
              )}

              <div className="campo">
                <label>Correo electrónico</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="campo">
                <label>Contraseña</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <button type="submit" className="btn btn-primario" style={{ width: '100%', marginBottom: '1rem' }}>
                {modoRegistro ? 'Registrarme' : 'Entrar'}
              </button>
            </form>

            <button
              type="button"
              className="btn btn-suave"
              style={{ width: '100%' }}
              onClick={() => {
                setModoRegistro(!modoRegistro);
                setError('');
              }}
            >
              {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿Primera vez? Crea tu cuenta'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seccion">
      <div className="contenedor">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <span className="etiqueta">Área Personal</span>
            <h1 style={{ fontSize: '2.5rem' }}>Hola, {usuario.nombre}</h1>
            <p style={{ color: 'var(--texto-suave)' }}>{usuario.email}</p>
          </div>
          <button type="button" className="btn btn-contorno" onClick={cerrarSesion}>
            <LogOut size={16} /> Cerrar sesión
          </button>
        </div>

        {error && <div className="alerta-error">{error}</div>}
        {mensaje && <div className="alerta-exito">{mensaje}</div>}

        {/* Bonos activos */}
        {bonos.length > 0 && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Ticket size={20} /> Mis Bonos y Tarjetas Regalo
            </h2>
            <div className="grid-3">
              {bonos.map((b) => (
                <div key={b.id} className="tarjeta" style={{ padding: '1.2rem' }}>
                  <strong>{b.nombre_bono}</strong>
                  <p style={{ color: 'var(--terracota)', fontSize: '1.15rem', fontWeight: 700, marginTop: '0.3rem' }}>
                    {b.sesiones_restantes} / {b.sesiones_totales} sesiones disponibles
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mis Citas */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} /> Mis Citas
          </h2>
          {citas.length === 0 ? (
            <p style={{ color: 'var(--texto-suave)' }}>Aún no tienes citas reservadas.</p>
          ) : (
            <div className="grid-2">
              {citas.map((c) => (
                <div key={c.id} className="tarjeta" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <span className="etiqueta" style={{ marginBottom: '0.35rem' }}>{c.estado}</span>
                    <h3 style={{ fontSize: '1.3rem' }}>{c.servicio_nombre}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--texto-suave)' }}>
                      {c.fecha} · {c.hora_inicio.slice(0, 5)} ({c.modalidad})
                    </p>
                    <small style={{ color: 'var(--salvia)' }}>Pago: {c.pago_estado}</small>
                    {c.estado === 'cancelada' && c.motivo_cancelacion && (
                      <p style={{ fontSize: '0.84rem', color: 'var(--error)', marginTop: '0.4rem' }}>
                        <strong>Motivo:</strong> {c.motivo_cancelacion}
                      </p>
                    )}
                  </div>
                  {c.estado !== 'cancelada' && c.estado !== 'completada' && (
                    <button type="button" className="btn btn-suave" onClick={() => cancelarMiCita(c.id)}>
                      Cancelar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mis Pedidos */}
        <section>
          <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={20} /> Mis Pedidos en Tienda
          </h2>
          {pedidos.length === 0 ? (
            <p style={{ color: 'var(--texto-suave)' }}>Todavía no has realizado ningún pedido.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pedidos.map((p) => (
                <div key={p.id} className="tarjeta" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <strong>Pedido #{p.id.slice(0, 8)} · {p.estado}</strong>
                    <strong style={{ color: 'var(--terracota)' }}>{Number(p.total).toFixed(2)} €</strong>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--texto-suave)', marginBottom: '0.5rem' }}>
                    Envío: {p.direccion_envio}
                  </p>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.88rem' }}>
                    {p.detalles?.map((d) => (
                      <li key={d.id}>
                        {d.cantidad}x {d.producto_nombre} ({Number(d.precio_unitario).toFixed(2)} €)
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
