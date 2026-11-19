// ============================================================================
// ADMIN: CLIENTES Y FICHAS PRIVADAS DE EVOLUCIÓN + BONOS
// ============================================================================
import { useEffect, useState } from 'react';
import { apiFetch } from '../../../services/api';

export default function ClientesAdmin() {
  const [clientes, setClientes] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [fichas, setFichas] = useState([]);

  const [motivo, setMotivo] = useState('');
  const [contraindicaciones, setContraindicaciones] = useState('');
  const [notasPrivadas, setNotasPrivadas] = useState('');
  const [nombreBono, setNombreBono] = useState('Bono 5 Masajes');
  const [sesionesBono, setSesionesBono] = useState(5);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Estados para editar los datos del cliente seleccionado
  const [editNombre, setEditNombre] = useState('');
  const [editApellidos, setEditApellidos] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editActivo, setEditActivo] = useState(true);

  useEffect(() => {
    cargarClientes();
  }, []);

  function cargarClientes() {
    apiFetch('/clientes').then((res) => setClientes(res.clientes || []));
  }

  function verFichas(cliente) {
    setSeleccionado(cliente);
    setEditNombre(cliente.nombre || '');
    setEditApellidos(cliente.apellidos || '');
    setEditEmail(cliente.email || '');
    setEditTelefono(cliente.telefono || '');
    setEditActivo(Boolean(cliente.activo ?? true));
    setMensaje('');
    setError('');
    apiFetch(`/clientes/${cliente.id}/fichas`).then((res) => setFichas(res.fichas || []));
  }

  async function guardarDatosCliente(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      const res = await apiFetch(`/clientes/${seleccionado.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: editNombre,
          apellidos: editApellidos,
          email: editEmail,
          telefono: editTelefono,
          activo: editActivo
        })
      });
      setMensaje(res.mensaje);
      setSeleccionado({
        ...seleccionado,
        nombre: editNombre,
        apellidos: editApellidos,
        email: editEmail,
        telefono: editTelefono,
        activo: editActivo
      });
      cargarClientes();
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarCliente() {
    if (!window.confirm(`¿Seguro que quieres eliminar o desactivar a ${seleccionado.nombre} ${seleccionado.apellidos}?`)) return;
    setError('');
    setMensaje('');
    try {
      const res = await apiFetch(`/clientes/${seleccionado.id}`, { method: 'DELETE' });
      setMensaje(res.mensaje);
      setSeleccionado(null);
      setFichas([]);
      cargarClientes();
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardarFicha(e) {
    e.preventDefault();
    await apiFetch(`/clientes/${seleccionado.id}/fichas`, {
      method: 'POST',
      body: JSON.stringify({
        motivo_consulta: motivo,
        contraindicaciones,
        notas_privadas_terapeuta: notasPrivadas
      })
    });
    setMotivo('');
    setContraindicaciones('');
    setNotasPrivadas('');
    setMensaje('Ficha privada de evolución guardada.');
    verFichas(seleccionado);
  }

  async function darBono(e) {
    e.preventDefault();
    await apiFetch(`/clientes/${seleccionado.id}/bonos`, {
      method: 'POST',
      body: JSON.stringify({ nombre_bono: nombreBono, sesiones_totales: Number(sesionesBono) })
    });
    setMensaje('Bono asignado al cliente.');
  }

  return (
    <div className="grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
      <div>
        <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem' }}>Listado de Clientes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {clientes.map((c) => (
            <div
              key={c.id}
              onClick={() => verFichas(c)}
              className="tarjeta"
              style={{
                padding: '1rem', cursor: 'pointer',
                borderColor: seleccionado?.id === c.id ? 'var(--terracota)' : undefined
              }}
            >
              <strong>{c.nombre} {c.apellidos}</strong> {!c.activo && <small style={{ color: 'var(--error)' }}>(Inactivo)</small>}
              <div style={{ fontSize: '0.85rem', color: 'var(--texto-suave)' }}>
                {c.email} · {c.total_citas} citas
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        {!seleccionado ? (
          <p style={{ color: 'var(--texto-suave)' }}>Selecciona un cliente para ver su ficha privada y asignar bonos.</p>
        ) : (
          <div>
            <h2 style={{ fontSize: '1.7rem', marginBottom: '0.75rem' }}>
              Ficha de {seleccionado.nombre} {seleccionado.apellidos}
            </h2>
            {error && <div className="alerta-error">{error}</div>}
            {mensaje && <div className="alerta-exito">{mensaje}</div>}

            {/* Editar o eliminar cliente */}
            <form onSubmit={guardarDatosCliente} className="tarjeta" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Datos del cliente</h3>
              <div className="grid-2">
                <div className="campo">
                  <label>Nombre</label>
                  <input type="text" required value={editNombre} onChange={(e) => setEditNombre(e.target.value)} />
                </div>
                <div className="campo">
                  <label>Apellidos</label>
                  <input type="text" required value={editApellidos} onChange={(e) => setEditApellidos(e.target.value)} />
                </div>
              </div>
              <div className="grid-2">
                <div className="campo">
                  <label>Email</label>
                  <input type="email" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </div>
                <div className="campo">
                  <label>Teléfono</label>
                  <input type="tel" value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.9rem' }}>
                  <input type="checkbox" checked={editActivo} onChange={(e) => setEditActivo(e.target.checked)} />
                  Cliente activo
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primario">Guardar cambios</button>
                  <button type="button" className="btn btn-contorno" onClick={eliminarCliente}>
                    Eliminar cliente
                  </button>
                </div>
              </div>
            </form>

            <form onSubmit={guardarFicha} className="tarjeta" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Nueva nota de evolución privada</h3>
              <div className="campo">
                <label>Motivo de consulta</label>
                <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
              </div>
              <div className="campo">
                <label>Contraindicaciones / Alergias</label>
                <input type="text" value={contraindicaciones} onChange={(e) => setContraindicaciones(e.target.value)} />
              </div>
              <div className="campo">
                <label>Notas privadas de la terapeuta</label>
                <textarea rows={3} required value={notasPrivadas} onChange={(e) => setNotasPrivadas(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primario">Guardar en ficha privada</button>
            </form>

            <form onSubmit={darBono} className="tarjeta" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Asignar Bono / Tarjeta Regalo</h3>
              <div className="grid-2">
                <div className="campo">
                  <label>Nombre del bono</label>
                  <input type="text" required value={nombreBono} onChange={(e) => setNombreBono(e.target.value)} />
                </div>
                <div className="campo">
                  <label>Sesiones</label>
                  <input type="number" min="1" required value={sesionesBono} onChange={(e) => setSesionesBono(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-salvia">Asignar bono</button>
            </form>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.6rem' }}>Historial privado</h3>
            {fichas.map((f) => (
              <div key={f.id} className="tarjeta" style={{ padding: '1rem', marginBottom: '0.6rem' }}>
                <small style={{ color: 'var(--salvia)' }}>{f.creado_en?.slice(0, 10)}</small>
                {f.contraindicaciones && <p style={{ color: 'var(--error)', fontSize: '0.88rem' }}><strong>Alerta:</strong> {f.contraindicaciones}</p>}
                {f.motivo_consulta && <p style={{ fontSize: '0.9rem' }}><strong>Motivo:</strong> {f.motivo_consulta}</p>}
                {f.notas_privadas_terapeuta && <p style={{ fontSize: '0.9rem' }}><strong>Evolución:</strong> {f.notas_privadas_terapeuta}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
