// ============================================================================
// PÁGINA DE RESERVA PASO A PASO (Servicio -> Fecha/Hora -> Anamnesis y Señal)
// ============================================================================
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import SelectorServicio from '../../components/reservas/SelectorServicio';
import CalendarioCitas from '../../components/reservas/CalendarioCitas';

export default function ReservarPage() {
  const { usuario } = useAuth();
  const [searchParams] = useSearchParams();

  const [servicios, setServicios] = useState([]);
  const [bonos, setBonos] = useState([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
  const [modalidad, setModalidad] = useState('presencial');
  const [fecha, setFecha] = useState(() => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return manana.toISOString().split('T')[0];
  });
  const [horaSeleccionada, setHoraSeleccionada] = useState('');

  // Campos del cuestionario previo (Anamnesis) y pago
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [contraindicaciones, setContraindicaciones] = useState('');
  const [notasCliente, setNotasCliente] = useState('');
  const [bonoId, setBonoId] = useState('');
  const [tipoPago, setTipoPago] = useState('senal');
  const [metodoPago, setMetodoPago] = useState('tarjeta');

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [confirmada, setConfirmada] = useState(null);

  useEffect(() => {
    apiFetch('/servicios').then((res) => {
      const lista = res.servicios || [];
      setServicios(lista);
      const preId = Number(searchParams.get('servicio'));
      if (preId) {
        const encontrado = lista.find((s) => s.id === preId);
        if (encontrado) {
          setServicioSeleccionado(encontrado);
          setModalidad(encontrado.modalidad === 'online' ? 'online' : 'presencial');
        }
      }
    });
  }, [searchParams]);

  // Si el cliente está logueado, cargamos sus bonos activos para poder canjearlos
  useEffect(() => {
    if (!usuario) return;
    apiFetch('/clientes/bonos/mios')
      .then((res) => setBonos((res.bonos || []).filter((b) => b.sesiones_restantes > 0)))
      .catch(() => {});
  }, [usuario]);

  async function confirmarReserva(e) {
    e.preventDefault();
    setError('');
    if (!servicioSeleccionado || !fecha || !horaSeleccionada) {
      setError('Selecciona terapia, día y hora libre para continuar.');
      return;
    }

    setEnviando(true);
    try {
      const res = await apiFetch('/citas', {
        method: 'POST',
        body: JSON.stringify({
          servicio_id: servicioSeleccionado.id,
          fecha,
          hora_inicio: horaSeleccionada,
          modalidad,
          notas_cliente: notasCliente,
          motivo_consulta: motivoConsulta,
          contraindicaciones,
          bono_id: bonoId || null,
          tipo_pago: bonoId ? 'bono' : tipoPago,
          metodo_pago: metodoPago
        })
      });
      setConfirmada(res.cita);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (confirmada) {
    return (
      <div className="seccion">
        <div className="contenedor" style={{ maxWidth: '640px' }}>
          <div className="tarjeta" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="var(--exito)" style={{ margin: '0 auto 1rem' }} />
            <h1 style={{ fontSize: '2.3rem', marginBottom: '0.6rem' }}>¡Reserva Confirmada!</h1>
            <p style={{ color: 'var(--texto-suave)', marginBottom: '1.5rem' }}>
              Te esperamos el <strong>{confirmada.fecha}</strong> a las <strong>{confirmada.hora_inicio}</strong> para tu sesión de <strong>{servicioSeleccionado?.nombre}</strong>. Recibirás un recordatorio automático 24h antes.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <Link to="/mi-cuenta" className="btn btn-primario">Ver mis citas</Link>
              <Link to="/" className="btn btn-suave">Volver al inicio</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seccion">
      <div className="contenedor" style={{ maxWidth: '960px' }}>
        <span className="etiqueta" style={{ marginBottom: '0.6rem' }}>Reserva Online</span>
        <h1 style={{ fontSize: '2.7rem', marginBottom: '0.5rem' }}>Pide tu cita paso a paso</h1>
        <p style={{ color: 'var(--texto-suave)', marginBottom: '2rem' }}>
          Política de tranquilidad: puedes cancelar o reprogramar sin coste hasta 24 horas antes.
        </p>

        {error && <div className="alerta-error">{error}</div>}

        {/* Paso 1: Elegir terapia */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem' }}>1. Elige tu terapia</h2>
          <SelectorServicio
            servicios={servicios}
            servicioSeleccionado={servicioSeleccionado}
            onSeleccionar={(s) => {
              setServicioSeleccionado(s);
              setModalidad(s.modalidad === 'online' ? 'online' : 'presencial');
              setHoraSeleccionada('');
            }}
          />
        </section>

        {/* Paso 2: Elegir modalidad, fecha y hora */}
        {servicioSeleccionado && (
          <section style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem' }}>2. Elige fecha y hora libre</h2>

            {servicioSeleccionado.modalidad === 'ambas' && (
              <div className="campo" style={{ maxWidth: '300px' }}>
                <label>Modalidad de la sesión</label>
                <select value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
                  <option value="presencial">Presencial (en el centro)</option>
                  <option value="online">Online (videollamada)</option>
                </select>
              </div>
            )}

            <CalendarioCitas
              servicio={servicioSeleccionado}
              fecha={fecha}
              setFecha={setFecha}
              horaSeleccionada={horaSeleccionada}
              setHoraSeleccionada={setHoraSeleccionada}
            />
          </section>
        )}

        {/* Paso 3: Cuestionario Anamnesis + Pago / Bono */}
        {servicioSeleccionado && horaSeleccionada && (
          <section>
            <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem' }}>3. Cuestionario previo y confirmación</h2>

            {!usuario ? (
              <div className="tarjeta" style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem' }}>
                  Para confirmar tu cita a las <strong>{horaSeleccionada}</strong> el <strong>{fecha}</strong>, inicia sesión o crea tu cuenta en un minuto.
                </p>
                <Link to="/mi-cuenta" className="btn btn-primario">Ir a Iniciar Sesión / Registro</Link>
              </div>
            ) : (
              <form onSubmit={confirmarReserva} className="tarjeta" style={{ padding: '1.8rem' }}>
                <div className="grid-2">
                  <div className="campo">
                    <label>Motivo de la consulta o intención</label>
                    <textarea
                      rows={3}
                      placeholder="Ej: Estrés laboral, contractura cervical, buscar claridad..."
                      value={motivoConsulta}
                      onChange={(e) => setMotivoConsulta(e.target.value)}
                    />
                  </div>
                  <div className="campo">
                    <label>Alergias, embarazo o lesiones (Anamnesis)</label>
                    <textarea
                      rows={3}
                      placeholder="Ej: Alergia a frutos secos/lavanda, embarazo, lesión lumbar... (Opcional)"
                      value={contraindicaciones}
                      onChange={(e) => setContraindicaciones(e.target.value)}
                    />
                  </div>
                </div>

                <div className="campo">
                  <label>Notas adicionales para la terapeuta</label>
                  <input
                    type="text"
                    placeholder="Cualquier preferencia de música, temperatura o intensidad..."
                    value={notasCliente}
                    onChange={(e) => setNotasCliente(e.target.value)}
                  />
                </div>

                {/* Selección de Bono o Pago de Señal */}
                {bonos.length > 0 && (
                  <div className="campo">
                    <label>¿Quieres usar uno de tus bonos disponibles?</label>
                    <select value={bonoId} onChange={(e) => setBonoId(e.target.value)}>
                      <option value="">No, pagar esta sesión ahora</option>
                      {bonos.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.nombre_bono} ({b.sesiones_restantes} sesiones restantes)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {!bonoId && (
                  <div className="grid-2">
                    <div className="campo">
                      <label>Modalidad de pago</label>
                      <select value={tipoPago} onChange={(e) => setTipoPago(e.target.value)}>
                        <option value="senal">
                          Señal de reserva (25%: {Math.max(15, Number(servicioSeleccionado.precio) * 0.25).toFixed(2)} €)
                        </option>
                        <option value="total">
                          Pago completo ({Number(servicioSeleccionado.precio).toFixed(2)} €)
                        </option>
                      </select>
                    </div>
                    <div className="campo">
                      <label>Pasarela</label>
                      <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                        <option value="tarjeta">Tarjeta (Stripe)</option>
                        <option value="bizum">Bizum</option>
                      </select>
                    </div>
                  </div>
                )}

                <button type="submit" className="btn btn-primario" style={{ width: '100%', marginTop: '0.5rem' }} disabled={enviando}>
                  {enviando ? 'Confirmando tu cita...' : `Confirmar reserva (${fecha} · ${horaSeleccionada})`}
                </button>
              </form>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
