import { Resend } from 'resend';

// Initialize Resend with API key
const getResendApiKey = () => {
  // Try environment variable first
  const envKey = import.meta.env.VITE_RESEND_API_KEY;
  // Fallback to hardcoded key for development
  const fallbackKey = 're_63XS6Sdb_E5UaWaUCbeAretdrqJwFBwrn';

  const apiKey = envKey || fallbackKey;

  // Debug logging (remove in production)
  console.log('Resend API Key source:', envKey ? 'Environment' : 'Fallback');
  console.log('API Key loaded:', apiKey ? 'Yes' : 'No');
  console.log('API Key starts with:', apiKey?.substring(0, 8) + '...');

  return apiKey;
};

const RESEND_API_KEY = getResendApiKey();
const resend = new Resend(RESEND_API_KEY);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const EmailService = {
  // Check if email service is properly configured
  isConfigured: () => {
    return !!RESEND_API_KEY && RESEND_API_KEY.startsWith('re_');
  },

  // Send welcome email to new members
  sendWelcomeEmail: async (to: string, name: string, membershipTier: string) => {
    if (!EmailService.isConfigured()) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'I-Team Society <noreply@iteam-society.com>',
        to,
        subject: 'Welcome to I-Team Society! 🎉',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to I-Team Society</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Welcome to I-Team Society!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">The Open University of Sri Lanka</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1e40af; margin-top: 0;">Hello ${name}! 👋</h2>
              
              <p>Congratulations! Your membership application has been approved and you're now an official member of I-Team Society.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1e40af;">
                <h3 style="margin-top: 0; color: #1e40af;">Your Membership Details:</h3>
                <p><strong>Membership Tier:</strong> ${membershipTier.toUpperCase()}</p>
                <p><strong>Status:</strong> Active</p>
              </div>
              
              <h3 style="color: #1e40af;">What's Next?</h3>
              <ul style="padding-left: 20px;">
                <li>Access your dashboard to view upcoming events</li>
                <li>Download your digital E-ID card</li>
                <li>Connect with fellow members</li>
                <li>Participate in society activities</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}/dashboard" 
                   style="background: #1e40af; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Access Your Dashboard
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you have any questions, feel free to contact us at support@iteam-society.com
              </p>
            </div>
          </body>
          </html>
        `
      });

      if (error) throw error;
      console.log('Welcome email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  },

  // Send event reminder email
  sendEventReminder: async (to: string, name: string, eventTitle: string, eventDate: string, eventLocation?: string) => {
    if (!EmailService.isConfigured()) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'I-Team Society Events <events@iteam-society.com>',
        to,
        subject: `Reminder: ${eventTitle} is tomorrow! 📅`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Event Reminder</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Event Reminder 📅</h1>
            </div>
            
            <div style="background: #f0fdf4; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #059669; margin-top: 0;">Hi ${name}!</h2>
              
              <p>This is a friendly reminder about the upcoming event you're registered for:</p>
              
              <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
                <h3 style="margin-top: 0; color: #059669; font-size: 20px;">${eventTitle}</h3>
                <p><strong>📅 Date:</strong> ${new Date(eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p><strong>🕒 Time:</strong> ${new Date(eventDate).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</p>
                ${eventLocation ? `<p><strong>📍 Location:</strong> ${eventLocation}</p>` : ''}
              </div>
              
              <p>We're excited to see you there! Don't forget to bring your E-ID for attendance marking.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}/dashboard/events" 
                   style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  View Event Details
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Can't make it? Please update your registration status in your dashboard.
              </p>
            </div>
          </body>
          </html>
        `
      });

      if (error) throw error;
      console.log('Event reminder email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending event reminder email:', error);
      throw error;
    }
  },

  // Send membership expiry reminder
  sendMembershipExpiryReminder: async (to: string, name: string, expiryDate: string, tier: string) => {
    if (!EmailService.isConfigured()) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const daysUntilExpiry = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      const { data, error } = await resend.emails.send({
        from: 'I-Team Society <membership@iteam-society.com>',
        to,
        subject: `Membership Expiring in ${daysUntilExpiry} days ⏰`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Membership Renewal Reminder</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Membership Renewal Reminder ⏰</h1>
            </div>
            
            <div style="background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #dc2626; margin-top: 0;">Hi ${name}!</h2>
              
              <p>Your I-Team Society membership is expiring soon. Don't miss out on all the benefits!</p>
              
              <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <h3 style="margin-top: 0; color: #dc2626;">Membership Details:</h3>
                <p><strong>Current Tier:</strong> ${tier.toUpperCase()}</p>
                <p><strong>Expiry Date:</strong> ${new Date(expiryDate).toLocaleDateString()}</p>
                <p><strong>Days Remaining:</strong> ${daysUntilExpiry} days</p>
              </div>
              
              <h3 style="color: #dc2626;">Why Renew?</h3>
              <ul style="padding-left: 20px;">
                <li>Continue accessing exclusive events</li>
                <li>Maintain your membership benefits</li>
                <li>Stay connected with the I-Team community</li>
                <li>Access to career development resources</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}/dashboard/membership" 
                   style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  Renew Membership Now
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Questions about renewal? Contact us at membership@iteam-society.com
              </p>
            </div>
          </body>
          </html>
        `
      });

      if (error) throw error;
      console.log('Membership expiry reminder sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending membership expiry reminder:', error);
      throw error;
    }
  },

  // Send event cancellation notification
  sendEventCancellationEmail: async (to: string, name: string, eventTitle: string, eventDate: string, reason?: string) => {
    if (!EmailService.isConfigured()) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: 'I-Team Society Events <events@iteam-society.com>',
        to,
        subject: `Event Cancelled: ${eventTitle} ❌`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Event Cancellation</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">Event Cancellation Notice ❌</h1>
            </div>
            
            <div style="background: #fef2f2; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #dc2626; margin-top: 0;">Hi ${name},</h2>
              
              <p>We regret to inform you that the following event has been cancelled:</p>
              
              <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                <h3 style="margin-top: 0; color: #dc2626; font-size: 20px;">${eventTitle}</h3>
                <p><strong>Originally Scheduled:</strong> ${new Date(eventDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              </div>
              
              <p>We sincerely apologize for any inconvenience this may cause. Your registration has been automatically cancelled and no payment is required.</p>
              
              <p>We'll keep you updated about future events and look forward to seeing you at our upcoming activities.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}/dashboard/events" 
                   style="background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                  View Other Events
                </a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                Questions? Contact us at events@iteam-society.com
              </p>
            </div>
          </body>
          </html>
        `
      });

      if (error) throw error;
      console.log('Event cancellation email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending event cancellation email:', error);
      throw error;
    }
  },

  // Send custom email
  sendCustomEmail: async (template: EmailTemplate) => {
    if (!EmailService.isConfigured()) {
      console.warn('Email service not configured. Skipping email send.');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const { data, error } = await resend.emails.send({
        from: template.from || 'I-Team Society <noreply@iteam-society.com>',
        to: template.to,
        subject: template.subject,
        html: template.html
      });

      if (error) throw error;
      console.log('Custom email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending custom email:', error);
      throw error;
    }
  }
};
