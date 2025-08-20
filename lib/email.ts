'use server';

import { render } from '@react-email/render';
import { Resend } from 'resend';
import { reactPasswordResetEmail } from '@/emails/password-reset-email';
import { reactVerificationEmail } from '@/emails/verification-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail({
  user,
  url,
}: {
  user: { email: string; name?: string };
  url: string;
}) {
  const emailHtml = await render(
    reactVerificationEmail({
      username: user.name || user.email,
      verificationLink: url,
    })
  );

  const result = await resend.emails.send({
    from: `WAVFLIP Team <${process.env.RESEND_FROM_EMAIL as string}>`,
    to: user.email,
    subject: 'Verify your email address',
    html: emailHtml,
  });
  return result;
}

export async function sendPasswordResetEmail({
  user,
  url,
}: {
  user: { email: string; name?: string };
  url: string;
}) {
  const emailHtml = await render(
    reactPasswordResetEmail({
      username: user.name || user.email,
      resetLink: url,
    })
  );

  const result = await resend.emails.send({
    from: `WAVFLIP Team <${process.env.RESEND_FROM_EMAIL as string}>`,
    to: user.email,
    subject: 'Reset your password',
    html: emailHtml,
  });
  return result;
}
