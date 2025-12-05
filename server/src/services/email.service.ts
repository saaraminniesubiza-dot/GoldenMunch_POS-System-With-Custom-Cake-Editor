import nodemailer, { Transporter } from 'nodemailer';
import * as dotenv from 'dotenv';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

dotenv.config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface NotificationRecord {
  notification_id: number;
  request_id: number;
  notification_type: string;
  recipient_email: string;
  subject: string;
  message_body: string;
  status: 'pending' | 'sent' | 'failed';
  error_message?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    };

    // Check if email is properly configured
    if (!emailConfig.auth.user || !emailConfig.auth.pass) {
      console.warn('⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport(emailConfig);
      this.isConfigured = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send an email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('Email service not configured. Email not sent to:', options.to);
      return false;
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'GoldenMunch POS'}" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text || '',
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', info.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Process all pending notifications in the database
   */
  async processPendingNotifications(): Promise<void> {
    if (!this.isConfigured) {
      console.log('Email service not configured. Skipping pending notifications.');
      return;
    }

    try {
      // Get all pending notifications
      const [notifications] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM custom_cake_notifications
         WHERE status = 'pending'
         ORDER BY created_at ASC
         LIMIT 50`
      );

      if (notifications.length === 0) {
        return;
      }

      console.log(`📧 Processing ${notifications.length} pending notifications...`);

      for (const notification of notifications) {
        await this.sendNotification(notification as NotificationRecord);
      }
    } catch (error) {
      console.error('Error processing pending notifications:', error);
    }
  }

  /**
   * Send a single notification from database record
   */
  async sendNotification(notification: NotificationRecord): Promise<void> {
    try {
      const success = await this.sendEmail({
        to: notification.recipient_email,
        subject: notification.subject,
        html: notification.message_body,
        text: this.stripHtml(notification.message_body),
      });

      if (success) {
        // Update notification status to sent
        await pool.query(
          `UPDATE custom_cake_notifications
           SET status = 'sent', sent_at = NOW()
           WHERE notification_id = ?`,
          [notification.notification_id]
        );
      } else {
        // Mark as failed
        await pool.query(
          `UPDATE custom_cake_notifications
           SET status = 'failed', error_message = 'Failed to send email'
           WHERE notification_id = ?`,
          [notification.notification_id]
        );
      }
    } catch (error) {
      console.error(`Failed to send notification ${notification.notification_id}:`, error);
      await pool.query(
        `UPDATE custom_cake_notifications
         SET status = 'failed', error_message = ?
         WHERE notification_id = ?`,
        [error instanceof Error ? error.message : 'Unknown error', notification.notification_id]
      );
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    try {
      const [notifications] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM custom_cake_notifications
         WHERE status = 'failed'
         AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOURS)
         ORDER BY created_at ASC
         LIMIT 20`
      );

      console.log(`🔄 Retrying ${notifications.length} failed notifications...`);

      for (const notification of notifications) {
        // Reset status to pending before retrying
        await pool.query(
          `UPDATE custom_cake_notifications
           SET status = 'pending', error_message = NULL
           WHERE notification_id = ?`,
          [notification.notification_id]
        );

        await this.sendNotification(notification as NotificationRecord);
      }
    } catch (error) {
      console.error('Error retrying failed notifications:', error);
    }
  }

  /**
   * Strip HTML tags for plain text email
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  /**
   * Send pickup reminder notifications
   */
  async sendPickupReminders(): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    try {
      // Get all approved custom cakes with pickup scheduled for tomorrow
      const [requests] = await pool.query<RowDataPacket[]>(
        `SELECT
          ccr.request_id,
          ccr.customer_name,
          ccr.customer_email,
          ccr.customer_phone,
          ccr.scheduled_pickup_date,
          ccr.scheduled_pickup_time,
          ccr.approved_price,
          co.order_number,
          co.verification_code
         FROM custom_cake_request ccr
         LEFT JOIN customer_order co ON ccr.order_id = co.order_id
         WHERE ccr.status IN ('approved', 'completed')
         AND ccr.scheduled_pickup_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
         AND NOT EXISTS (
           SELECT 1 FROM custom_cake_notifications
           WHERE request_id = ccr.request_id
           AND notification_type = 'reminder'
           AND DATE(created_at) = CURDATE()
         )`
      );

      console.log(`📅 Sending ${requests.length} pickup reminders for tomorrow...`);

      for (const request of requests) {
        await this.createPickupReminder(request);
      }
    } catch (error) {
      console.error('Error sending pickup reminders:', error);
    }
  }

  /**
   * Create pickup reminder notification
   */
  async createPickupReminder(request: any): Promise<void> {
    const pickupDate = new Date(request.scheduled_pickup_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const pickupTime = request.scheduled_pickup_time || 'during business hours';

    const subject = '🎂 Reminder: Your Custom Cake is Ready for Pickup Tomorrow!';
    const messageBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B35;">🎂 Pickup Reminder</h2>

        <p>Dear ${request.customer_name},</p>

        <p>This is a friendly reminder that your custom cake is ready for pickup <strong>tomorrow</strong>!</p>

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #FF6B35;">Pickup Details:</h3>
          <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${pickupDate}</p>
          <p style="margin: 10px 0;"><strong>🕐 Time:</strong> ${pickupTime}</p>
          ${request.order_number ? `<p style="margin: 10px 0;"><strong>📋 Order Number:</strong> ${request.order_number}</p>` : ''}
          ${request.verification_code ? `<p style="margin: 10px 0;"><strong>🔑 Verification Code:</strong> ${request.verification_code}</p>` : ''}
          <p style="margin: 10px 0;"><strong>💰 Total Amount:</strong> ₱${request.approved_price?.toFixed(2) || '0.00'}</p>
        </div>

        <p><strong>Important Notes:</strong></p>
        <ul>
          <li>Please bring your verification code for easy pickup</li>
          <li>Arrive within the scheduled time to ensure your cake is at its best</li>
          <li>Contact us if you need to reschedule</li>
        </ul>

        <p>We look forward to seeing you tomorrow!</p>

        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>GoldenMunch Team</strong><br>
          📞 ${process.env.BUSINESS_PHONE || 'Contact us'}<br>
          📧 ${process.env.EMAIL_USER || 'Email us'}
        </p>
      </div>
    `;

    try {
      // Insert reminder notification
      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO custom_cake_notifications
         (request_id, notification_type, recipient_email, subject, message_body, status)
         VALUES (?, 'reminder', ?, ?, ?, 'pending')`,
        [request.request_id, request.customer_email, subject, messageBody]
      );

      const notificationId = result.insertId;

      // Send immediately
      await this.sendNotification({
        notification_id: notificationId,
        request_id: request.request_id,
        notification_type: 'reminder',
        recipient_email: request.customer_email,
        subject,
        message_body: messageBody,
        status: 'pending',
      });

      console.log(`✅ Pickup reminder sent to ${request.customer_email}`);
    } catch (error) {
      console.error('Error creating pickup reminder:', error);
    }
  }

  /**
   * Send admin notification for new custom cake request
   */
  async notifyAdminNewRequest(requestId: number): Promise<void> {
    if (!this.isConfigured) {
      return;
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminEmail) {
      console.warn('No admin email configured');
      return;
    }

    try {
      // Get request details
      const [requests] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM custom_cake_request WHERE request_id = ?`,
        [requestId]
      );

      if (requests.length === 0) {
        return;
      }

      const request = requests[0];

      const subject = `🔔 New Custom Cake Request #${requestId}`;
      const messageBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B35;">🔔 New Custom Cake Request</h2>

          <p>A new custom cake request has been submitted and is awaiting your review.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #FF6B35;">Request Details:</h3>
            <p><strong>Request ID:</strong> ${request.request_id}</p>
            <p><strong>Customer:</strong> ${request.customer_name}</p>
            <p><strong>Email:</strong> ${request.customer_email}</p>
            <p><strong>Phone:</strong> ${request.customer_phone}</p>
            <p><strong>Layers:</strong> ${request.num_layers}</p>
            <p><strong>Estimated Price:</strong> ₱${request.estimated_price?.toFixed(2) || '0.00'}</p>
            <p><strong>Submitted:</strong> ${new Date(request.submitted_at).toLocaleString()}</p>
          </div>

          <p><strong>Action Required:</strong> Please review this request in the admin panel and approve or reject it.</p>

          <a href="${process.env.BACKEND_URL}/admin/custom-cakes/${requestId}"
             style="display: inline-block; background-color: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Review Request
          </a>
        </div>
      `;

      await this.sendEmail({
        to: adminEmail,
        subject,
        html: messageBody,
      });

      console.log(`✅ Admin notified of new request #${requestId}`);
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Email connection verified');
      return true;
    } catch (error) {
      console.error('❌ Email connection failed:', error);
      return false;
    }
  }

  /**
   * ==========================================
   * ENHANCED WORKFLOW EMAIL TEMPLATES
   * ==========================================
   */

  /**
   * Send quote ready email to customer
   */
  async sendQuoteEmail(requestId: number, trackingCode: string, quotedPrice: number, quoteNotes?: string): Promise<void> {
    try {
      const [requests] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM custom_cake_request WHERE request_id = ?`,
        [requestId]
      );

      if (requests.length === 0) return;

      const request = requests[0];

      const subject = `🎂 Your Custom Cake Quote is Ready! - ${trackingCode}`;
      const messageBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎂 Quote Ready!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your custom cake quote is here</p>
          </div>

          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="font-size: 16px; color: #333;">Dear ${request.customer_name},</p>

            <p style="color: #555;">Great news! We've reviewed your custom cake design and prepared a quote for you.</p>

            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #FF6B35;">
              <h2 style="margin: 0 0 20px 0; color: #FF6B35; font-size: 20px;">Quote Details</h2>
              <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                <p style="margin: 0; color: #666; font-size: 14px;">Total Price</p>
                <p style="margin: 5px 0 0 0; color: #10b981; font-size: 32px; font-weight: bold;">₱${quotedPrice.toFixed(2)}</p>
              </div>
              <p style="margin: 10px 0;"><strong>📋 Tracking Code:</strong> <span style="font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${trackingCode}</span></p>
              <p style="margin: 10px 0;"><strong>⏱️ Preparation Time:</strong> ${request.preparation_days || 3} days</p>
              ${quoteNotes ? `<p style="margin: 15px 0; padding: 15px; background: white; border-radius: 6px;"><strong>📝 Our Notes:</strong><br/><em style="color: #666;">"${quoteNotes}"</em></p>` : ''}
            </div>

            <div style="background-color: #fef3c7; border: 2px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #92400e;">📌 Next Steps:</h3>
              <ol style="margin: 0; padding-left: 20px; color: #78350f;">
                <li style="margin-bottom: 10px;">Make your payment to the account details below</li>
                <li style="margin-bottom: 10px;">Upload your payment receipt using the tracking link</li>
                <li style="margin-bottom: 10px;">We'll verify your payment within 24 hours</li>
                <li>Once verified, we'll schedule your pickup date!</li>
              </ol>
            </div>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #374151;">💳 Payment Information</h3>
              <p style="margin: 5px 0; color: #555;"><strong>GCash:</strong> ${process.env.GCASH_NUMBER || '09XX-XXX-XXXX'}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Bank Transfer:</strong> ${process.env.BANK_ACCOUNT || 'Contact us for details'}</p>
              <p style="margin: 15px 0 5px 0; color: #ef4444; font-weight: bold;">⚠️ Amount to Pay: ₱${quotedPrice.toFixed(2)}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/track/${trackingCode}"
                 style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(255, 107, 53, 0.3);">
                📤 Upload Payment Receipt
              </a>
            </div>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
              Questions? Contact us at ${process.env.BUSINESS_PHONE || 'our store'} or reply to this email.
            </p>

            <p style="margin-top: 20px; color: #888; font-size: 14px;">
              Best regards,<br>
              <strong style="color: #FF6B35;">GoldenMunch Team</strong>
            </p>
          </div>
        </div>
      `;

      await this.sendEmail({
        to: request.customer_email,
        subject,
        html: messageBody,
      });

      console.log(`✅ Quote email sent to ${request.customer_email}`);
    } catch (error) {
      console.error('Error sending quote email:', error);
    }
  }

  /**
   * Send payment verification email (approved)
   */
  async sendPaymentVerifiedEmail(requestId: number, trackingCode: string): Promise<void> {
    try {
      const [requests] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM custom_cake_request WHERE request_id = ?`,
        [requestId]
      );

      if (requests.length === 0) return;

      const request = requests[0];

      const subject = `✅ Payment Verified! - ${trackingCode}`;
      const messageBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">✅ Payment Verified!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">We've confirmed your payment</p>
          </div>

          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="font-size: 16px; color: #333;">Dear ${request.customer_name},</p>

            <p style="color: #555;">Excellent news! Your payment has been verified and confirmed.</p>

            <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #10b981;">
              <h2 style="margin: 0 0 15px 0; color: #059669;">Payment Confirmed</h2>
              <p style="margin: 10px 0;"><strong>📋 Tracking Code:</strong> ${trackingCode}</p>
              <p style="margin: 10px 0;"><strong>💰 Amount Paid:</strong> ₱${request.quoted_price?.toFixed(2)}</p>
              <p style="margin: 10px 0;"><strong>✅ Status:</strong> Payment Verified</p>
            </div>

            <div style="background-color: #dbeafe; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1e40af;">🎉 What's Next?</h3>
              <ol style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                <li style="margin-bottom: 10px;">We'll schedule your pickup date and time</li>
                <li style="margin-bottom: 10px;">You'll receive an email with pickup details</li>
                <li style="margin-bottom: 10px;">Our bakers will start working on your cake</li>
                <li>You'll receive updates as your cake progresses!</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/track/${trackingCode}"
                 style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📊 Track Your Order
              </a>
            </div>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
              Thank you for choosing GoldenMunch! We can't wait to create your perfect cake.
            </p>

            <p style="margin-top: 20px; color: #888; font-size: 14px;">
              Best regards,<br>
              <strong style="color: #10b981;">GoldenMunch Team</strong>
            </p>
          </div>
        </div>
      `;

      await this.sendEmail({
        to: request.customer_email,
        subject,
        html: messageBody,
      });

      console.log(`✅ Payment verified email sent to ${request.customer_email}`);
    } catch (error) {
      console.error('Error sending payment verified email:', error);
    }
  }

  /**
   * Send payment rejected email
   */
  async sendPaymentRejectedEmail(requestId: number, trackingCode: string, rejectionReason: string): Promise<void> {
    try {
      const [requests] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM custom_cake_request WHERE request_id = ?`,
        [requestId]
      );

      if (requests.length === 0) return;

      const request = requests[0];

      const subject = `⚠️ Payment Receipt Issue - ${trackingCode}`;
      const messageBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Action Required</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Issue with payment receipt</p>
          </div>

          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="font-size: 16px; color: #333;">Dear ${request.customer_name},</p>

            <p style="color: #555;">We've reviewed your payment receipt but encountered an issue that needs your attention.</p>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 10px 0; color: #92400e;">Issue Details:</h3>
              <p style="color: #78350f; margin: 0; font-style: italic;">"${rejectionReason}"</p>
            </div>

            <div style="background-color: #dbeafe; border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #1e40af;">📝 How to Fix This:</h3>
              <ol style="margin: 0; padding-left: 20px; color: #1e3a8a;">
                <li style="margin-bottom: 10px;">Review the issue mentioned above</li>
                <li style="margin-bottom: 10px;">Take a clear photo of your payment receipt</li>
                <li style="margin-bottom: 10px;">Upload the new receipt using the link below</li>
                <li>We'll verify it within 24 hours</li>
              </ol>
            </div>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0 0 10px 0;"><strong>📋 Tracking Code:</strong> ${trackingCode}</p>
              <p style="margin: 0 0 10px 0;"><strong>💰 Amount to Pay:</strong> ₱${request.quoted_price?.toFixed(2)}</p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/track/${trackingCode}"
                 style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📤 Upload New Receipt
              </a>
            </div>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
              If you have any questions or need assistance, please don't hesitate to contact us.
            </p>

            <p style="margin-top: 20px; color: #888; font-size: 14px;">
              Best regards,<br>
              <strong style="color: #f59e0b;">GoldenMunch Team</strong>
            </p>
          </div>
        </div>
      `;

      await this.sendEmail({
        to: request.customer_email,
        subject,
        html: messageBody,
      });

      console.log(`✅ Payment rejected email sent to ${request.customer_email}`);
    } catch (error) {
      console.error('Error sending payment rejected email:', error);
    }
  }

  /**
   * Send pickup scheduled email
   */
  async sendPickupScheduledEmail(requestId: number, trackingCode: string, pickupDate: string, pickupTime: string): Promise<void> {
    try {
      const [requests] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM custom_cake_request WHERE request_id = ?`,
        [requestId]
      );

      if (requests.length === 0) return;

      const request = requests[0];

      const formattedDate = new Date(pickupDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const subject = `📅 Pickup Scheduled - ${trackingCode}`;
      const messageBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📅 Pickup Scheduled!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Your cake pickup date is confirmed</p>
          </div>

          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="font-size: 16px; color: #333;">Dear ${request.customer_name},</p>

            <p style="color: #555;">Great news! Your pickup date has been scheduled. Mark your calendar!</p>

            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #3b82f6;">
              <h2 style="margin: 0 0 20px 0; color: #1e40af; font-size: 20px;">Pickup Details</h2>
              <div style="background: white; padding: 20px; border-radius: 6px;">
                <p style="margin: 10px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                <p style="margin: 10px 0;"><strong>🕐 Time:</strong> ${pickupTime}</p>
                <p style="margin: 10px 0;"><strong>📋 Tracking Code:</strong> <span style="font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${trackingCode}</span></p>
                <p style="margin: 10px 0;"><strong>💰 Amount Paid:</strong> ₱${request.quoted_price?.toFixed(2)}</p>
              </div>
            </div>

            <div style="background-color: #fef3c7; border: 2px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="margin: 0 0 15px 0; color: #92400e;">⏰ Important Reminders:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #78350f;">
                <li style="margin-bottom: 10px;">Please arrive on time to ensure your cake is at its best</li>
                <li style="margin-bottom: 10px;">Bring your tracking code for quick pickup</li>
                <li style="margin-bottom: 10px;">Contact us if you need to reschedule</li>
                <li>We'll send you a reminder the day before pickup</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/track/${trackingCode}"
                 style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📊 View Order Status
              </a>
            </div>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
              Our bakers are getting started on your cake. We'll keep you updated on the progress!
            </p>

            <p style="margin-top: 20px; color: #888; font-size: 14px;">
              Best regards,<br>
              <strong style="color: #3b82f6;">GoldenMunch Team</strong>
            </p>
          </div>
        </div>
      `;

      await this.sendEmail({
        to: request.customer_email,
        subject,
        html: messageBody,
      });

      console.log(`✅ Pickup scheduled email sent to ${request.customer_email}`);
    } catch (error) {
      console.error('Error sending pickup scheduled email:', error);
    }
  }

  /**
   * Notify admin of new payment receipt upload
   */
  async notifyAdminPaymentReceiptUploaded(requestId: number, trackingCode: string): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminEmail) return;

    try {
      const [requests] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM custom_cake_request WHERE request_id = ?`,
        [requestId]
      );

      if (requests.length === 0) return;

      const request = requests[0];

      const subject = `💳 Payment Receipt Uploaded - ${trackingCode}`;
      const messageBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B35;">💳 Payment Receipt Uploaded</h2>

          <p>A customer has uploaded a payment receipt for verification.</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #FF6B35;">Order Details:</h3>
            <p><strong>Request ID:</strong> ${requestId}</p>
            <p><strong>Tracking Code:</strong> ${trackingCode}</p>
            <p><strong>Customer:</strong> ${request.customer_name}</p>
            <p><strong>Quoted Price:</strong> ₱${request.quoted_price?.toFixed(2)}</p>
          </div>

          <p><strong>Action Required:</strong> Please verify the payment receipt in the admin panel.</p>

          <a href="${process.env.BACKEND_URL}/admin/custom-cakes/${requestId}"
             style="display: inline-block; background-color: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Verify Payment
          </a>
        </div>
      `;

      await this.sendEmail({
        to: adminEmail,
        subject,
        html: messageBody,
      });

      console.log(`✅ Admin notified of payment receipt upload for ${trackingCode}`);
    } catch (error) {
      console.error('Error notifying admin of payment receipt:', error);
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
