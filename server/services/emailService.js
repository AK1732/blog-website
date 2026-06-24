export async function sendEmail({ to, subject, text }) {
  if (!process.env.SMTP_HOST) {
    console.log('Email queued (development mode):', { to, subject, text });
    return;
  }

  console.log('SMTP email delivery is not configured with a transport package. Email content:', {
    to,
    subject,
    text,
  });
}
