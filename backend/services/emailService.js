// ============================================================================
// SERVICIO DE NOTIFICACIONES (Emails y Recordatorios automáticos 24h)
// ============================================================================

/**
 * enviarConfirmacionCita: Simula o envía el correo/WhatsApp de confirmación al reservar.
 */
async function enviarConfirmacionCita({ email, nombre, servicioNombre, fecha, horaInicio, modalidad }) {
  // En producción aquí se conectaría nodemailer o la API de WhatsApp Business
  console.log('------------------------------------------------------------');
  console.log(`[EMAIL / WHATSAPP] Confirmación de cita para: ${nombre} (${email})`);
  console.log(`Terapia: ${servicioNombre} (${modalidad})`);
  console.log(`Fecha y hora: ${fecha} a las ${horaInicio}`);
  console.log('Incluye enlace al cuestionario previo de anamnesis y política 24h.');
  console.log('------------------------------------------------------------');
  return { enviado: true, canal: 'simulado' };
}

/**
 * enviarRecordatorio24h: Envía el aviso automático 24 horas antes para evitar ausencias.
 */
async function enviarRecordatorio24h({ email, telefono, nombre, servicioNombre, fecha, horaInicio }) {
  console.log('------------------------------------------------------------');
  console.log(`[RECORDATORIO 24H] Hola ${nombre}, te recordamos tu sesión mañana:`);
  console.log(`Servicio: ${servicioNombre} | ${fecha} a las ${horaInicio}`);
  console.log(`Destinatarios: Email (${email}) / WhatsApp (${telefono || 'no indicado'})`);
  console.log('------------------------------------------------------------');
  return { enviado: true };
}

/**
 * enviarCancelacionCita: Notifica al cliente cuando el centro cancela su cita indicando el motivo.
 */
async function enviarCancelacionCita({ email, nombre, servicioNombre, fecha, horaInicio, motivo }) {
  console.log('------------------------------------------------------------');
  console.log(`[EMAIL / WHATSAPP] Cita cancelada para: ${nombre} (${email})`);
  console.log(`Terapia: ${servicioNombre} | ${fecha} a las ${horaInicio}`);
  console.log(`Motivo: ${motivo || 'No especificado'}`);
  console.log('------------------------------------------------------------');
  return { enviado: true, canal: 'simulado' };
}

/**
 * enviarRecuperacionPassword: Envía el código/enlace de restablecimiento de contraseña.
 */
async function enviarRecuperacionPassword({ email, nombre, token }) {
  console.log('------------------------------------------------------------');
  console.log(`[EMAIL RECUPERACIÓN] Hola ${nombre} (${email})`);
  console.log(`Código / Token para restablecer contraseña (válido 15 min): ${token}`);
  console.log('------------------------------------------------------------');
  return { enviado: true, canal: 'simulado' };
}

/**
 * enviarConfirmacionPedido: Notifica al cliente cuando el administrador acepta/confirma su pedido.
 */
async function enviarConfirmacionPedido({ email, nombre, pedidoId, total }) {
  console.log('------------------------------------------------------------');
  console.log(`[EMAIL PEDIDO ACEPTADO] Hola ${nombre} (${email})`);
  console.log(`Tu pedido #${pedidoId.slice(0, 8)} (${Number(total).toFixed(2)} €) ha sido aceptado.`);
  console.log('En breve se pondrá en contacto contigo la empresa repartidora para la entrega.');
  console.log('------------------------------------------------------------');
  return { enviado: true, canal: 'simulado' };
}

module.exports = {
  enviarConfirmacionCita,
  enviarRecordatorio24h,
  enviarCancelacionCita,
  enviarRecuperacionPassword,
  enviarConfirmacionPedido
};
