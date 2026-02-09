import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export default async function handler(req, res) {
  // CORS (para que te deje llamar desde GitHub Pages)
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { name, email, message, website } = req.body || {};

    // Honeypot anti-bots: este campo debe venir vacío
    if (website) return res.status(200).json({ ok: true });

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Faltan campos" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Email no válido" });
    }
    if (String(message).length > 5000) {
      return res.status(400).json({ error: "Mensaje demasiado largo" });
    }

    await resend.emails.send({
      from: process.env.FROM_EMAIL,       // ej: "Portfolio <no-reply@tu-dominio.com>"
      to: process.env.TO_EMAIL,           // tu correo
      replyTo: email,                     // para responderle directamente
      subject: `Nuevo mensaje web: ${name}`,
      text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Error enviando el email" });
  }
}
