// ============================================================================
// TARJETA DE PRODUCTO PARA LA TIENDA NATURAL
// ============================================================================
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function TarjetaProducto({ producto }) {
  const { agregarProducto } = useCart();
  const sinStock = producto.stock <= 0;

  return (
    <article className="tarjeta" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ height: '200px', overflow: 'hidden', background: 'var(--bg-piedra)' }}>
          <img
            src={producto.imagen_url || 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80'}
            alt={producto.nombre}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ padding: '1.2rem' }}>
          <span className="etiqueta" style={{ marginBottom: '0.5rem' }}>{producto.categoria}</span>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.35rem' }}>{producto.nombre}</h3>
          {producto.ingredientes_o_autor && (
            <p style={{ fontSize: '0.8rem', color: 'var(--salvia)', fontWeight: 600, marginBottom: '0.45rem' }}>
              {producto.categoria === 'libros' ? 'Autor: ' : 'Composición: '}
              {producto.ingredientes_o_autor}
            </p>
          )}
          <p style={{ fontSize: '0.9rem', color: 'var(--texto-suave)' }}>{producto.descripcion}</p>
        </div>
      </div>

      <div style={{ padding: '0 1.2rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div>
          <strong style={{ fontSize: '1.2rem', color: 'var(--terracota)' }}>
            {Number(producto.precio).toFixed(2)} €
          </strong>
          <div style={{ fontSize: '0.78rem', color: sinStock ? 'var(--error)' : 'var(--texto-suave)' }}>
            {sinStock ? 'Agotado' : `${producto.stock} disponibles`}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primario"
          disabled={sinStock}
          onClick={() => agregarProducto(producto)}
          style={{ padding: '0.6rem 1rem', fontSize: '0.88rem' }}
        >
          <ShoppingBag size={15} /> {sinStock ? 'Agotado' : 'Añadir'}
        </button>
      </div>
    </article>
  );
}
