require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Servicio de correo (Gmail + Nodemailer)
 * Requiere en .env: SMTP_USER, SMTP_APP_PASSWORD, MAIL_FROM (opcional), FRONTEND_URL
 * El transporter se crea de forma perezosa para no romper el arranque si falta config.
 */

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_APP_PASSWORD;

    if (!user || !pass) {
        throw new Error('Falta configuración SMTP: define SMTP_USER y SMTP_APP_PASSWORD en el .env');
    }

    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
        secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE !== 'false' : true,
        auth: { user, pass }
    });

    return transporter;
}

async function sendPasswordResetEmail(correo, resetLink) {
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperación de contraseña</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6f9; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
              
              <!-- Encabezado con identidad visual -->
              <tr>
                <td style="background-color: #272727; padding: 30px; text-align: center;">
                  <h1 style="color: #e1b964; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">MUIG UPTC</h1>
                  <p style="color: #e1b964; margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Museo Universitario de Ingeniería Geológica</p>
                </td>
              </tr>

              <!-- Cuerpo del mensaje -->
              <tr>
                <td style="padding: 40px 35px; color: #333333; line-height: 1.6;">
                  <h2 style="margin-top: 0; color: #1a1a1a; font-size: 20px; font-weight: 600;">Restablecimiento de Contraseña</h2>
                  <p style="margin: 15px 0; color: #555555; font-size: 15px;">
                    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el siguiente botón para continuar:
                  </p>
                  
                  <!-- Botón de acción principal -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto;">
                    <tr>
                      <td align="center" style="border-radius: 8px; background-color: #e1b964;">
                        <a href="${resetLink}" target="_blank" style="font-size: 15px; font-family: inherit; color: #ffffff; text-decoration: none; border-radius: 8px; padding: 14px 28px; border: 1px solid #fdfdfd; display: inline-block; font-weight: 600;">
                          Restablecer Contraseña
                        </a>
                      </td>
                    </tr>
                  </table>

                  <p style="margin: 20px 0 0 0; color: #666666; font-size: 13px; line-height: 1.5;">
                    Este enlace estará disponible durante <strong>1 hora</strong> y solo puede usarse <strong>una única vez</strong>.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;" />
                  
                  <!-- Respaldo para clientes sin soporte de links en botones -->
                  <p style="margin: 0; color: #888888; font-size: 12px; word-break: break-all;">
                    Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:<br>
                    <a href="${resetLink}" style="color: #003366; text-decoration: underline;">${resetLink}</a>
                  </p>
                </td>
              </tr>

              <!-- Pie de página informativo -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 35px; text-align: center; border-top: 1px solid #edf2f7; color: #888888; font-size: 12px;">
                  <p style="margin: 0;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
                  <p style="margin: 8px 0 0 0; font-size: 11px; color: #aaaaaa;">&copy; ${new Date().getFullYear()} MUIG - UPTC. Todos los derechos reservados.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const mailOptions = {
        from: `"MUIG UPTC" <${from}>`,
        to: correo,
        subject: 'Recuperación de contraseña — MUIG',
        text: `Solicitaste recuperar tu contraseña.\n\nUsa este enlace (válido por 1 hora, un solo uso):\n${resetLink}\n\nSi no fuiste tú, ignora este correo.`,
        html: htmlContent
    };

    await getTransporter().sendMail(mailOptions);
}

function buildResetLink(plainToken) {
    const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    return `${base}/reset-password?token=${encodeURIComponent(plainToken)}`;
}

module.exports = { sendPasswordResetEmail, buildResetLink };
