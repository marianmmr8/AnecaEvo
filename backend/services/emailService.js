// ============================================================================
// SERVICIO DE NOTIFICACIONES (Emails reales con Nodemailer o modo simulado)
// ============================================================================
const nodemailer = require('nodemailer');

function obtenerTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

async function enviarEmail({ to, subject, text }) {
  const transporter = obtenerTransporter();
  if (!transporter) {
    console.log('------------------------------------------------------------');
    console.log(`[EMAIL SIMULADO] Para: ${to} | Asunto: ${subject}`);
    console.log(text);
    console.log('------------------------------------------------------------');
    return { enviado: true, canal: 'simulado' };
  }

  const correoAdmin = process.env.ADMIN_EMAIL || 'marian.corporativo1@yahoo.com';

  await transporter.sendMail({
    from: `"Aneca Evo" <${process.env.SMTP_USER}>`,
    replyTo: correoAdmin,
    to,
    subject,
    text
  });
  return { enviado: true, canal: 'smtp' };
}

async function enviarConfirmacionCita({ email, nombre, servicioNombre, fecha, horaInicio, modalidad }) {
  return enviarEmail({
    to: email,
    subject: `Cita confirmada: ${servicioNombre} - Aneca Evo`,
    text: `Hola ${nombre},\n\nTu cita de ${servicioNombre} (${modalidad}) ha quedado confirmada para el ${fecha} a las ${horaInicio}.\nRecuerda que puedes cancelar o reprogramar hasta 24h antes desde Mi cuenta.\n\nUn abrazo,\nAneca Evo`
  });
}

async function enviarRecordatorio24h({ email, nombre, servicioNombre, fecha, horaInicio }) {
  return enviarEmail({
    to: email,
    subject: `Recordatorio de tu cita mañana - Aneca Evo`,
    text: `Hola ${nombre},\n\nTe recordamos tu sesión de ${servicioNombre} mañana ${fecha} a las ${horaInicio}.\n\nTe esperamos,\nAneca Evo`
  });
}

async function enviarCancelacionCita({ email, nombre, servicioNombre, fecha, horaInicio, motivo }) {
  return enviarEmail({
    to: email,
    subject: `Cita cancelada - Aneca Evo (${fecha})`,
    text: `Hola ${nombre},\n\nLamentamos informarte de que tu cita de ${servicioNombre} del ${fecha} a las ${horaInicio} ha sido cancelada.\nMotivo: ${motivo || 'No especificado'}\n\nUn abrazo,\nAneca Evo`
  });
}

async function enviarRecuperacionPassword({ email, nombre, token }) {
  return enviarEmail({
    to: email,
    subject: 'Restablecer contraseña - Aneca Evo',
    text: `Hola ${nombre},\n\nTu código para restablecer la contraseña (válido durante 15 minutos) es:\n\n${token}\n\nSi no lo solicitaste, ignora este mensaje.\n\nAneca Evo`
  });
}

async function enviarConfirmacionPedido({ email, nombre, pedidoId, total }) {
  return enviarEmail({
    to: email,
    subject: `Pedido #${pedidoId.slice(0, 8)} aceptado - Aneca Evo`,
    text: `Hola ${nombre},\n\nTu pedido #${pedidoId.slice(0, 8)} (${Number(total).toFixed(2)} €) ha sido aceptado.\nEn breve se pondrá en contacto contigo la empresa repartidora para la entrega.\n\nUn abrazo,\nAneca Evo`
  });
}

module.exports = {
  enviarConfirmacionCita,
  enviarRecordatorio24h,
  enviarCancelacionCita,
  enviarRecuperacionPassword,
  enviarConfirmacionPedido
};
