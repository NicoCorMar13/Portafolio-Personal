import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const allowed = process.env.ALLOWED_ORIGIN;

  // Devuelve CORS solo al origin permitido (o todos si no se configuró)
  if (!allowed || allowed === "*") {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  } else if (origin === allowed) {
    res.setHeader("Access-Control-Allow-Origin", allowed);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { name, email, message, website } = req.body || {};
    if (website) return res.status(200).json({ ok: true });

    if (!name || !email || !message) return res.status(400).json({ error: "Faltan campos" });
    if (!isValidEmail(email)) return res.status(400).json({ error: "Email no válido" });

    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: process.env.TO_EMAIL,
      replyTo: email,
      subject: `Nuevo mensaje web: ${name}`,
      text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Error enviando el email" });
  }
}

