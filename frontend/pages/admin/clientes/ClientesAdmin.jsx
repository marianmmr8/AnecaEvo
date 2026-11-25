// ============================================================================
// ADMIN: CLIENTES Y FICHAS PRIVADAS DE EVOLUCIÓN + BONOS
// ============================================================================
import { useEffect, useState } from 'react';
import { Download, Mail, MessageCircle, Search, ChevronDown } from 'lucide-react';
import { apiFetch } from '../../../services/api';
import { descargarTarjetaRegaloPDF } from '../../../services/tarjetaPdf';
import CalendarioCitas from '../../../components/reservas/CalendarioCitas';

export default function ClientesAdmin() {
  const [clientes, setClientes] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [mostrarTodosClientes, setMostrarTodosClientes] = useState(false);
  const [seccionAbierta, setSeccionAbierta] = useState('reservar'); // 'reservar' | 'datos' | 'notas' | 'bonos' | 'regalo'
  const [seleccionado, setSeleccionado] = useState(null);
  const [fichas, setFichas] = useState([]);

  const [editandoFichaId, setEditandoFichaId] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [contraindicaciones, setContraindicaciones] = useState('');
  const [notasPrivadas, setNotasPrivadas] = useState('');
  const [bonoServicioId, setBonoServicioId] = useState('');
  const [sesionesBono, setSesionesBono] = useState(5);
  const [servicios, setServicios] = useState([]);
  const [regaloServicioId, setRegaloServicioId] = useState('');
  const [regaloPrecio, setRegaloPrecio] = useState('65');
  const [regaloDescripcion, setRegaloDescripcion] = useState('');
  const [regaloDedicatoria, setRegaloDedicatoria] = useState('');
  const [tarjetaGeneradaAdmin, setTarjetaGeneradaAdmin] = useState(null);
  const [bonosCliente, setBonosCliente] = useState([]);
  const [codigoCanjearAdmin, setCodigoCanjearAdmin] = useState('');
  const [reservaServId, setReservaServId] = useState('');
  const [reservaFecha, setReservaFecha] = useState(() => new Date().toISOString().split('T')[0]);
  const [reservaHora, setReservaHora] = useState('');
  const [reservaBonoId, setReservaBonoId] = useState('');
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
    apiFetch('/servicios')
      .then((res) => {
        const lista = res.servicios || [];
        setServicios(lista);
        if (lista.length > 0) setBonoServicioId(String(lista[0].id));
      })
      .catch(() => {});
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
    const serv = servicios.find((s) => String(s.id) === bonoServicioId);
    if (!serv) return;
    const nombreGenerado = `Bono ${sesionesBono}x ${serv.nombre}`;
    await apiFetch(`/clientes/${seleccionado.id}/bonos`, {
      method: 'POST',
      body: JSON.stringify({
        servicio_id: serv.id,
        nombre_bono: nombreGenerado,
        sesiones_totales: Number(sesionesBono)
      })
    });
    setMensaje(`${nombreGenerado} asignado al cliente.`);
    verFichas(seleccionado);
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

  const terminoBusqueda = busquedaCliente.trim().toLowerCase();
  const clientesVisibles = terminoBusqueda
    ? clientes.filter((c) =>
        `${c.nombre} ${c.apellidos}`.toLowerCase().includes(terminoBusqueda) ||
        (c.telefono || '').includes(terminoBusqueda)
      )
    : mostrarTodosClientes
      ? clientes
      : [];

  return (
    <div className="grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
      <div>
        <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem' }}>Buscar Cliente</h2>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--texto-suave)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o teléfono..."
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 0.9rem 0.6rem 2.2rem',
                borderRadius: 10, border: '1px solid var(--borde-suave)', background: '#fff'
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-suave"
            onClick={() => {
              setBusquedaCliente('');
              setMostrarTodosClientes(!mostrarTodosClientes);
            }}
          >
            {mostrarTodosClientes && !terminoBusqueda ? 'Ocultar lista' : `Todos los clientes (${clientes.length})`}
          </button>
        </div>

        {clientesVisibles.length === 0 ? (
          <p style={{ color: 'var(--texto-suave)', fontSize: '0.9rem' }}>
            {terminoBusqueda
              ? 'No se encontró ningún cliente con ese nombre o teléfono.'
              : 'Escribe un nombre o teléfono para buscar, o pulsa "Todos los clientes".'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {clientesVisibles.map((c) => (
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
                  {c.telefono || c.email} · {c.total_citas} citas
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--salvia)' }}>
                  Cliente desde: {c.fecha_registro?.slice(0, 10)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        {!seleccionado ? (
          <p style={{ color: 'var(--texto-suave)' }}>Selecciona un cliente para abrir su ficha y desplegables.</p>
        ) : (
          <div>
            <h2 style={{ fontSize: '1.7rem', marginBottom: '0.25rem' }}>
              Ficha de {seleccionado.nombre} {seleccionado.apellidos}
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--salvia)', marginBottom: '0.9rem' }}>
              Registrado el {seleccionado.fecha_registro?.slice(0, 10)} · {seleccionado.telefono || 'Sin teléfono'} · {seleccionado.email}
            </p>
            {error && <div className="alerta-error">{error}</div>}
            {mensaje && <div className="alerta-exito">{mensaje}</div>}

            {/* Desplegable 1: Reservar cita presencial */}
            <button
              type="button"
              className="btn btn-suave"
              style={{ width: '100%', justifyContent: 'space-between', marginBottom: '0.6rem' }}
              onClick={() => setSeccionAbierta(seccionAbierta === 'reservar' ? '' : 'reservar')}
            >
              <span>📅 Reservar cita presencial para {seleccionado.nombre}</span>
              <ChevronDown size={16} />
            </button>
            {seccionAbierta === 'reservar' && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                setMensaje('');
                try {
                  const res = await apiFetch('/citas', {
                    method: 'POST',
                    body: JSON.stringify({
                      cliente_id: seleccionado.id,
                      servicio_id: Number(reservaServId),
                      fecha: reservaFecha,
                      hora_inicio: reservaHora,
                      modalidad: 'presencial',
                      bono_id: reservaBonoId || null,
                      tipo_pago: reservaBonoId ? 'bono' : 'efectivo'
                    })
                  });
                  setMensaje(res.mensaje);
                  setReservaHora('');
                  verFichas(seleccionado);
                } catch (err) {
                  setError(err.message);
                }
              }}
              className="tarjeta"
              style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#fdf8f2' }}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Reservar cita presencial para {seleccionado.nombre}</h3>
              <div className="grid-2">
                <div className="campo">
                  <label>Terapia</label>
                  <select required value={reservaServId} onChange={(e) => setReservaServId(e.target.value)}>
                    <option value="">Elige una terapia...</option>
                    {servicios.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label>Usar bono del cliente (opcional)</label>
                  <select value={reservaBonoId} onChange={(e) => setReservaBonoId(e.target.value)}>
                    <option value="">No, pagar en clínica</option>
                    {bonosCliente.filter((b) => b.sesiones_restantes > 0).map((b) => (
                      <option key={b.id} value={b.id}>{b.nombre_bono} ({b.sesiones_restantes} rest.)</option>
                    ))}
                  </select>
                </div>
              </div>
              {reservaServId && (
                <div style={{ marginBottom: '1rem' }}>
                  <CalendarioCitas
                    servicio={servicios.find((s) => String(s.id) === reservaServId)}
                    fecha={reservaFecha}
                    setFecha={setReservaFecha}
                    horaSeleccionada={reservaHora}
                    setHoraSeleccionada={setReservaHora}
                  />
                </div>
              )}
              <button type="submit" className="btn btn-primario" disabled={!reservaServId || !reservaHora}>
                Confirmar cita para el cliente
              </button>
            </form>
            )}

            {/* Desplegable 2: Datos del cliente */}
            <button
              type="button"
              className="btn btn-suave"
              style={{ width: '100%', justifyContent: 'space-between', marginBottom: '0.6rem' }}
              onClick={() => setSeccionAbierta(seccionAbierta === 'datos' ? '' : 'datos')}
            >
              <span>👤 Datos del cliente (Editar / Eliminar)</span>
              <ChevronDown size={16} />
            </button>
            {seccionAbierta === 'datos' && (
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
            )}

            {/* Desplegable 3: Notas privadas e Historial */}
            <button
              type="button"
              className="btn btn-suave"
              style={{ width: '100%', justifyContent: 'space-between', marginBottom: '0.6rem' }}
              onClick={() => setSeccionAbierta(seccionAbierta === 'notas' ? '' : 'notas')}
            >
              <span>📝 Notas privadas e Historial ({fichas.length})</span>
              <ChevronDown size={16} />
            </button>
            {seccionAbierta === 'notas' && (
            <div>
            <form onSubmit={guardarFicha} className="tarjeta" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
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

            {/* Desplegable 4: Bonos de sesiones */}
            <button
              type="button"
              className="btn btn-suave"
              style={{ width: '100%', justifyContent: 'space-between', marginBottom: '0.6rem' }}
              onClick={() => setSeccionAbierta(seccionAbierta === 'bonos' ? '' : 'bonos')}
            >
              <span>🎟️ Bonos de sesiones ({bonosCliente.length})</span>
              <ChevronDown size={16} />
            </button>
            {seccionAbierta === 'bonos' && (
            <form onSubmit={darBono} className="tarjeta" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
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
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
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
                          -1 sesión
                        </button>
                        <button
                          type="button"
                          className="btn btn-salvia"
                          style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                          disabled={b.sesiones_restantes >= b.sesiones_totales}
                          onClick={async () => {
                            setError('');
                            setMensaje('');
                            try {
                              const res = await apiFetch(`/clientes/bonos/${b.id}/sumar`, { method: 'PATCH' });
                              setMensaje(res.mensaje);
                              verFichas(seleccionado);
                            } catch (err) {
                              setError(err.message);
                            }
                          }}
                        >
                          +1 sesión (devolver)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid-2">
                <div className="campo">
                  <label>Terapia del bono</label>
                  <select value={bonoServicioId} onChange={(e) => setBonoServicioId(e.target.value)}>
                    {servicios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} ({Number(s.precio).toFixed(2)} € / sesión)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="campo">
                  <label>Pack de sesiones</label>
                  <select value={sesionesBono} onChange={(e) => setSesionesBono(Number(e.target.value))}>
                    <option value={3}>3 sesiones (5% dto.)</option>
                    <option value={5}>5 sesiones (10% dto.)</option>
                    <option value={10}>10 sesiones (15% dto.)</option>
                  </select>
                </div>
              </div>
              {(() => {
                const serv = servicios.find((s) => String(s.id) === bonoServicioId);
                if (!serv) return null;
                const dto = sesionesBono === 10 ? 0.15 : sesionesBono === 5 ? 0.10 : 0.05;
                const base = Number(serv.precio) * sesionesBono;
                const final = (base * (1 - dto)).toFixed(2);
                return (
                  <div style={{ marginBottom: '0.9rem', padding: '0.65rem 0.9rem', borderRadius: 8, background: '#fdf8f2', border: '1px solid var(--borde-suave)', fontSize: '0.9rem' }}>
                    <span style={{ textDecoration: 'line-through', color: 'var(--texto-suave)', marginRight: '0.5rem' }}>{base.toFixed(2)} €</span>
                    <strong style={{ color: 'var(--terracota)' }}>{final} €</strong>
                    <small style={{ marginLeft: '0.5rem', color: 'var(--salvia)', fontWeight: 600 }}>
                      (Ahorra {(base - Number(final)).toFixed(2)} €)
                    </small>
                  </div>
                );
              })()}
              <button type="submit" className="btn btn-salvia">Asignar bono</button>
            </form>
            )}

            {/* Desplegable 5: Tarjeta Regalo */}
            <button
              type="button"
              className="btn btn-suave"
              style={{ width: '100%', justifyContent: 'space-between', marginBottom: '0.6rem' }}
              onClick={() => setSeccionAbierta(seccionAbierta === 'regalo' ? '' : 'regalo')}
            >
              <span>🎁 Crear o canjear Tarjeta Regalo</span>
              <ChevronDown size={16} />
            </button>
            {seccionAbierta === 'regalo' && (
            <form onSubmit={crearTarjetaRegaloAdmin} className="tarjeta" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Crear Tarjeta Regalo (con código sin precio visible)</h3>
              <div className="grid-2">
                <div className="campo">
                  <label>Masaje / Terapia incluida</label>
                  <select
                    value={regaloServicioId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRegaloServicioId(val);
                      if (val) {
                        const s = servicios.find((x) => String(x.id) === val);
                        if (s) setRegaloPrecio(String(s.precio));
                      }
                    }}
                  >
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
