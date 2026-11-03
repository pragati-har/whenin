import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!resend) {
    console.warn(`Email skipped for ${to}: RESEND_API_KEY not configured.`);
    return { ok: false, skipped: true, message: 'Email provider not configured.' };
  }

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
      text,
    });

    return {
      ok: true,
      provider: 'resend',
      messageId: result.data?.id || null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email error';
    return { ok: false, provider: 'resend', message };
  }
}

export function createOfferEmailHTML({
  cafeName,
  offerTitle,
  discount,
  terms,
  validity,
  link,
}: {
  cafeName: string;
  offerTitle: string;
  discount: string;
  terms: string;
  validity: string;
  link: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; background:#f8f4ef; padding:24px; color:#2f1f1a;">
      <div style="max-width:640px; margin:0 auto; background:#fff; border-radius:20px; overflow:hidden; border:1px solid #f0e4d6;">
        <div style="background:#c85d2b; color:white; padding:24px 32px;">
          <h1 style="margin:0; font-size:28px;">WHEN IN</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="margin-top:0;">${offerTitle}</h2>
          <p><strong>Cafe:</strong> ${cafeName}</p>
          <p><strong>Deal:</strong> ${discount}</p>
          <p><strong>Validity:</strong> ${validity}</p>
          <p><strong>Terms:</strong> ${terms}</p>
          <p><a href="${link}" style="display:inline-block; background:#c85d2b; color:white; padding:12px 18px; border-radius:10px; text-decoration:none;">View offer</a></p>
        </div>
      </div>
    </div>
  `;
}
