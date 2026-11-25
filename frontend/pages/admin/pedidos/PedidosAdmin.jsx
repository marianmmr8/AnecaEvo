// ============================================================================
// ADMIN: GESTIÓN DE PEDIDOS DE LA TIENDA (Confirmar pedido y avisar al cliente)
// ============================================================================
import { useEffect, useState } from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { apiFetch } from '../../../services/api';

export default function PedidosAdmin() {
  const [pedidos, setPedidos] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPedidos();
  }, []);

  function cargarPedidos() {
    apiFetch('/pedidos/admin')
      .then((res) => setPedidos(res.pedidos || []))
      .catch((err) => setError(err.message));
  }

  async function actualizarPedido(id, estado) {
    setError('');
    setMensaje('');
    try {
      const res = await apiFetch(`/pedidos/${id}/confirmar`, {
        method: 'PATCH',
        body: JSON.stringify({ estado })
      });
      setMensaje(res.mensaje);
      cargarPedidos();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.7rem', marginBottom: '1rem' }}>Pedidos de la Tienda ({pedidos.length})</h2>
      {error && <div className="alerta-error">{error}</div>}
      {mensaje && <div className="alerta-exito">{mensaje}</div>}

      {pedidos.length === 0 ? (
        <p style={{ color: 'var(--texto-suave)' }}>Todavía no hay pedidos realizados.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pedidos.map((p) => (
            <div key={p.id} className="tarjeta" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <strong>Pedido #{p.id.slice(0, 8)} · {p.fecha_pedido?.slice(0, 16)}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span className="etiqueta">{p.estado}</span>
                  <strong style={{ color: 'var(--terracota)', fontSize: '1.1rem' }}>{Number(p.total).toFixed(2)} €</strong>
                </div>
              </div>

              <p style={{ fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                <strong>Cliente:</strong> {p.cliente_nombre} {p.cliente_apellidos} ({p.cliente_email})
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--texto-suave)', marginBottom: '0.6rem' }}>
                <strong>Datos de envío y comentario:</strong> {p.direccion_envio}
              </p>
              {p.nota_cliente_cambio && (
                <p style={{ fontSize: '0.84rem', color: 'var(--error)', fontWeight: 600, marginBottom: '0.6rem' }}>
                  ⚠️ {p.nota_cliente_cambio}
                </p>
              )}

              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.88rem', marginBottom: '0.9rem' }}>
                {p.detalles?.map((d) => (
                  <li key={d.id}>
                    {d.cantidad}x {d.producto_nombre} ({Number(d.precio_unitario).toFixed(2)} €)
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {p.estado === 'pagado' && (
                  <button type="button" className="btn btn-primario" style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }} onClick={() => actualizarPedido(p.id, 'preparando')}>
                    Confirmar pedido y avisar al cliente
                  </button>
                )}
                {p.estado === 'preparando' && (
                  <button type="button" className="btn btn-salvia" style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }} onClick={() => actualizarPedido(p.id, 'enviado')}>
                    Marcar como Enviado
                  </button>
                )}
                {p.estado === 'enviado' && (
                  <button type="button" className="btn btn-salvia" style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }} onClick={() => actualizarPedido(p.id, 'entregado')}>
                    Marcar como Entregado
                  </button>
                )}
                {p.cliente_email && (
                  <a
                    href={`mailto:${p.cliente_email}?subject=${encodeURIComponent(`Pedido #${p.id.slice(0, 8)} aceptado - Aneca Evo`)}&body=${encodeURIComponent(`Hola ${p.cliente_nombre},\n\nTu pedido en Aneca Evo ha sido aceptado. En breve se pondrá en contacto contigo la empresa repartidora para la entrega.\n\nUn abrazo,\nAneca Evo`)}`}
                    className="btn btn-suave"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                  >
                    <Mail size={14} /> Email
                  </a>
                )}
                {p.cliente_telefono && (
                  <a
                    href={`https://wa.me/${p.cliente_telefono.replace(/\D/g, '').length === 9 ? `34${p.cliente_telefono.replace(/\D/g, '')}` : p.cliente_telefono.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${p.cliente_nombre}, tu pedido en Aneca Evo ha sido aceptado. En breve se pondrá en contacto contigo la empresa repartidora.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-suave"
                    style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
