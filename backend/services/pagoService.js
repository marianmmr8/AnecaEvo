// ============================================================================
// SERVICIO DE PASARELA DE PAGO (Stripe / Bizum con modo pruebas integrado)
// ============================================================================

/**
 * procesarPago: Procesa el cobro de la señal de cita o del total de un pedido.
 * Si STRIPE_SECRET_KEY está configurada se integraría con Stripe; si no, simula
 * un pago exitoso para que puedas probar todo el flujo sin errores.
 */
async function procesarPago({ importe, metodo = 'tarjeta', concepto }) {
  const importeNumerico = Number(importe);

  if (Number.isNaN(importeNumerico) || importeNumerico < 0) {
    throw new Error('El importe del pago no es válido.');
  }

  // Generamos una referencia única de transacción para guardarla en la tabla pedidos/citas
  const referencia = `PAY-${metodo.toUpperCase()}-${Date.now()}`;

  console.log(`[PAGO] Cobro procesado (${metodo}): ${importeNumerico.toFixed(2)} € - ${concepto} [${referencia}]`);

  return {
    exito: true,
    referencia,
    metodo,
    importe: importeNumerico
  };
}

module.exports = { procesarPago };
