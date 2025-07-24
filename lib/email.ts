'use server';

import { Resend } from 'resend';
import { render } from '@react-email/render';
import { reactVerificationEmail } from '@/emails/verification-email';
import { reactPasswordResetEmail } from '@/emails/password-reset-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail({
  user,
  url,
}: {
  user: { email: string; name?: string };
  url: string;
}) {
  try {
    console.log('Attempting to send verification email to:', user.email);
    
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
    
    console.log('Verification email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail({
  user,
  url,
}: {
  user: { email: string; name?: string };
  url: string;
}) {
  try {
    console.log('Attempting to send password reset email to:', user.email);
    
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
    
    console.log('Password reset email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}