// ============================================================================
// CONTEXTO DEL CARRITO DE LA TIENDA (Productos añadidos y Carrito Lateral)
// ============================================================================
import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);       // Lista de { producto, cantidad }
  const [abierto, setAbierto] = useState(false); // Controla si el CarritoLateral está desplegado

  // Añade un producto al carrito respetando el stock disponible
  function agregarProducto(producto) {
    setItems((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id);
      if (existente) {
        if (existente.cantidad >= producto.stock) return prev;
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
    setAbierto(true); // Abre el carrito lateral para dar feedback inmediato
  }

  function cambiarCantidad(productoId, delta) {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.producto.id !== productoId) return i;
          const nueva = i.cantidad + delta;
          if (nueva > i.producto.stock) return i;
          return { ...i, cantidad: nueva };
        })
        .filter((i) => i.cantidad > 0)
    );
  }

  function vaciarCarrito() {
    setItems([]);
  }

  const totalUnidades = items.reduce((acc, i) => acc + i.cantidad, 0);
  const totalPrecio = items.reduce((acc, i) => acc + Number(i.producto.precio) * i.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        abierto,
        setAbierto,
        agregarProducto,
        cambiarCantidad,
        vaciarCarrito,
        totalUnidades,
        totalPrecio
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
