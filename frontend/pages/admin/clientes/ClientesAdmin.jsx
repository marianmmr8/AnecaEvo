// ============================================================================
// ADMIN: CLIENTES Y FICHAS PRIVADAS DE EVOLUCIÓN + BONOS
// ============================================================================
import { useEffect, useState } from 'react';
import { Download, Mail, MessageCircle } from 'lucide-react';
import { apiFetch } from '../../../services/api';
import { descargarTarjetaRegaloPDF } from '../../../services/tarjetaPdf';

export default function ClientesAdmin() {
  const [clientes, setClientes] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [fichas, setFichas] = useState([]);

  const [editandoFichaId, setEditandoFichaId] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [contraindicaciones, setContraindicaciones] = useState('');
  const [notasPrivadas, setNotasPrivadas] = useState('');
  const [nombreBono, setNombreBono] = useState('Bono 5 Masajes');
  const [sesionesBono, setSesionesBono] = useState(5);
  const [servicios, setServicios] = useState([]);
  const [regaloServicioId, setRegaloServicioId] = useState('');
  const [regaloPrecio, setRegaloPrecio] = useState('65');
  const [regaloDescripcion, setRegaloDescripcion] = useState('');
  const [regaloDedicatoria, setRegaloDedicatoria] = useState('');
  const [tarjetaGeneradaAdmin, setTarjetaGeneradaAdmin] = useState(null);
  const [bonosCliente, setBonosCliente] = useState([]);
  const [codigoCanjearAdmin, setCodigoCanjearAdmin] = useState('');
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
    apiFetch('/servicios').then((res) => setServicios(res.servicios || [])).catch(() => {});
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
    apiFetch(`/clientes/${cliente.id}/bonos`).then((res) => setBonosCliente(res.bonos || [])).catch(() => {});
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

  function cargarFichaParaEditar(ficha) {
    setEditandoFichaId(ficha.id);
    setMotivo(ficha.motivo_consulta || '');
    setContraindicaciones(ficha.contraindicaciones || '');
    setNotasPrivadas(ficha.notas_privadas_terapeuta || '');
    setMensaje('');
    setError('');
  }

  function limpiarFicha() {
    setEditandoFichaId(null);
    setMotivo('');
    setContraindicaciones('');
    setNotasPrivadas('');
  }

  async function guardarFicha(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      if (editandoFichaId) {
        await apiFetch(`/clientes/fichas/${editandoFichaId}`, {
          method: 'PUT',
          body: JSON.stringify({
            motivo_consulta: motivo,
            contraindicaciones,
            notas_privadas_terapeuta: notasPrivadas
          })
        });
        setMensaje('Ficha privada actualizada.');
      } else {
        await apiFetch(`/clientes/${seleccionado.id}/fichas`, {
          method: 'POST',
          body: JSON.stringify({
            motivo_consulta: motivo,
            contraindicaciones,
            notas_privadas_terapeuta: notasPrivadas
          })
        });
        setMensaje('Ficha privada de evolución guardada.');
      }
      limpiarFicha();
      verFichas(seleccionado);
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarFicha(fichaId) {
    if (!window.confirm('¿Seguro que quieres eliminar esta nota del historial privado?')) return;
    setError('');
    setMensaje('');
    try {
      await apiFetch(`/clientes/fichas/${fichaId}`, { method: 'DELETE' });
      if (editandoFichaId === fichaId) limpiarFicha();
      setMensaje('Nota eliminada del historial privado.');
      verFichas(seleccionado);
    } catch (err) {
      setError(err.message);
    }
  }

  async function darBono(e) {
    e.preventDefault();
    await apiFetch(`/clientes/${seleccionado.id}/bonos`, {
      method: 'POST',
      body: JSON.stringify({ nombre_bono: nombreBono, sesiones_totales: Number(sesionesBono) })
    });
    setMensaje('Bono asignado al cliente.');
  }

  async function crearTarjetaRegaloAdmin(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      const res = await apiFetch('/tarjetas/admin', {
        method: 'POST',
        body: JSON.stringify({
          servicio_id: regaloServicioId || null,
          precio_maximo: Number(regaloPrecio),
          nombre_destinatario: `${seleccionado.nombre} ${seleccionado.apellidos}`,
          descripcion_admin: regaloDescripcion,
          dedicatoria: regaloDedicatoria
        })
      });
      setMensaje(res.mensaje);
      setTarjetaGeneradaAdmin({
        ...res.tarjeta,
        nombre_destinatario: `${seleccionado.nombre} ${seleccionado.apellidos}`
      });
      setRegaloDescripcion('');
      setRegaloDedicatoria('');
    } catch (err) {
      setError(err.message);
    }
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
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>
                {editandoFichaId ? 'Editar nota de evolución privada' : 'Nueva nota de evolución privada'}
              </h3>
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primario">
                  {editandoFichaId ? 'Actualizar ficha' : 'Guardar en ficha privada'}
                </button>
                {editandoFichaId && (
                  <button type="button" className="btn btn-suave" onClick={limpiarFicha}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <form onSubmit={darBono} className="tarjeta" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Bonos de Sesiones del Cliente</h3>
              {bonosCliente.length > 0 && (
                <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {bonosCliente.map((b) => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'var(--bg-arena)', borderRadius: 8 }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>{b.nombre_bono}</strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--texto-suave)' }}>
                          Quedan <strong>{b.sesiones_restantes}</strong> de {b.sesiones_totales} sesiones
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primario"
                        style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                        disabled={b.sesiones_restantes <= 0}
                        onClick={async () => {
                          setError('');
                          setMensaje('');
                          try {
                            const res = await apiFetch(`/clientes/bonos/${b.id}/descontar`, { method: 'PATCH' });
                            setMensaje(res.mensaje);
                            verFichas(seleccionado);
                          } catch (err) {
                            setError(err.message);
                          }
                        }}
                      >
                        -1 sesión (cita hecha)
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

            <form onSubmit={crearTarjetaRegaloAdmin} className="tarjeta" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Crear Tarjeta Regalo (con código sin precio visible)</h3>
              <div className="grid-2">
                <div className="campo">
                  <label>Masaje / Terapia incluida</label>
                  <select value={regaloServicioId} onChange={(e) => setRegaloServicioId(e.target.value)}>
                    <option value="">A elección del destinatario (según valor)</option>
                    {servicios.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre} ({Number(s.precio).toFixed(2)} €)</option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label>Valor de la tarjeta (€)</label>
                  <input type="number" step="0.01" required value={regaloPrecio} onChange={(e) => setRegaloPrecio(e.target.value)} />
                </div>
              </div>
              <div className="campo">
                <label>En qué consiste el masaje / regalo</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ej: Sesión de 60 min de maderoterapia corporal + aromaterapia..."
                  value={regaloDescripcion}
                  onChange={(e) => setRegaloDescripcion(e.target.value)}
                />
              </div>
              <div className="campo">
                <label>Dedicatoria (opcional)</label>
                <input type="text" placeholder="Un momento de calma para ti..." value={regaloDedicatoria} onChange={(e) => setRegaloDedicatoria(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primario">Generar código de Tarjeta Regalo</button>

              {tarjetaGeneradaAdmin && (
                <div className="alerta-exito" style={{ marginTop: '1rem' }}>
                  <p style={{ marginBottom: '0.6rem' }}>
                    <strong>Tarjeta lista:</strong> {tarjetaGeneradaAdmin.codigo}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primario"
                      style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => descargarTarjetaRegaloPDF(tarjetaGeneradaAdmin)}
                    >
                      <Download size={14} /> Descargar PDF
                    </button>
                    {seleccionado.telefono && (
                      <a
                        href={`https://wa.me/${seleccionado.telefono.replace(/\D/g, '').length === 9 ? `34${seleccionado.telefono.replace(/\D/g, '')}` : seleccionado.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${seleccionado.nombre}, aquí tienes tu Tarjeta Regalo de Aneca Evo. Código para canjear: ${tarjetaGeneradaAdmin.codigo}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-salvia"
                        style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </a>
                    )}
                    {seleccionado.email && (
                      <a
                        href={`mailto:${seleccionado.email}?subject=${encodeURIComponent('Tu Tarjeta Regalo - Aneca Evo')}&body=${encodeURIComponent(`Hola ${seleccionado.nombre},\n\nAquí tienes tu Tarjeta Regalo de Aneca Evo.\nCódigo para canjear tu cita: ${tarjetaGeneradaAdmin.codigo}\n\nUn abrazo,\nAneca Evo`)}`}
                        className="btn btn-suave"
                        style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        <Mail size={14} /> Email
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--borde-suave)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Código a canjear (ej: ANECA-7RQEEB)"
                  value={codigoCanjearAdmin}
                  onChange={(e) => setCodigoCanjearAdmin(e.target.value.toUpperCase())}
                  style={{ flex: 1, minWidth: '180px', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--borde-suave)' }}
                />
                <button
                  type="button"
                  className="btn btn-salvia"
                  onClick={async () => {
                    if (!codigoCanjearAdmin.trim()) return;
                    setError('');
                    setMensaje('');
                    try {
                      const res = await apiFetch(`/tarjetas/${codigoCanjearAdmin.trim()}/canjear`, { method: 'PATCH' });
                      setMensaje(res.mensaje);
                      setCodigoCanjearAdmin('');
                    } catch (err) {
                      setError(err.message);
                    }
                  }}
                >
                  Marcar código como canjeado
                </button>
              </div>
            </form>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '0.6rem' }}>Historial privado</h3>
            {fichas.map((f) => (
              <div key={f.id} className="tarjeta" style={{ padding: '1rem', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <small style={{ color: 'var(--salvia)' }}>{f.creado_en?.slice(0, 10)}</small>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button type="button" className="btn btn-salvia" style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }} onClick={() => cargarFichaParaEditar(f)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-contorno" style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }} onClick={() => eliminarFicha(f.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
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
