const sgMail = require('@sendgrid/mail');

// Nastavenie API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || 'your-sendgrid-api-key');

class EmailService {
  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'portal@yourdomain.com';
    this.fromName = process.env.FROM_NAME || 'Portal App';
  }

  // Základná funkcia pre poslanie emailu
  async sendEmail(to, subject, html, text = null) {
    const msg = {
      to,
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
      subject,
      html,
      text: text || this.stripHtml(html)
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Email sent successfully to: ${to}`);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Welcome email pre nového používateľa
  async sendWelcomeEmail(userEmail, userName) {
    const subject = 'Vitajte v portáli!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Vitajte v portáli!</h1>
            <p>Vaše konto bolo úspešne vytvorené</p>
          </div>
          <div class="content">
            <h2>Ahoj ${userName}!</h2>
            <p>Ďakujeme za registráciu v našom portáli pre správu firiem a úloh.</p>
            <p>Teraz môžete:</p>
            <ul>
              <li>✅ Spravovať svoje firmy</li>
              <li>✅ Nahrať dokumenty</li>
              <li>✅ Vytvárať a sledovať úlohy</li>
              <li>✅ Komunikovať s účtovníkmi</li>
            </ul>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
              Prihlásiť sa do portálu
            </a>
            <p><strong>Ak máte otázky, neváhajte nás kontaktovať.</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 Portal App. Všetky práva vyhradené.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  // Password reset email
  async sendPasswordResetEmail(userEmail, resetToken) {
    const subject = 'Reset hesla - Portal App';
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Reset hesla</h1>
            <p>Požiadali ste o reset hesla</p>
          </div>
          <div class="content">
            <h2>Reset hesla pre účet: ${userEmail}</h2>
            <p>Dostali sme požiadavku na reset hesla pre váš účet.</p>
            <p>Ak ste to neboli vy, ignorujte tento email.</p>
            
            <div class="warning">
              <strong>⚠️ Dôležité:</strong> Tento link je platný len 1 hodinu!
            </div>
            
            <a href="${resetUrl}" class="button">
              Resetovať heslo
            </a>
            
            <p>Alebo skopírujte tento link do prehliadača:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          </div>
          <div class="footer">
            <p>© 2024 Portal App. Všetky práva vyhradené.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  // Notifikácia o novej úlohe
  async sendTaskNotification(userEmail, userName, taskTitle, taskDescription, companyName) {
    const subject = `Nová úloha: ${taskTitle}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .task-card { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Nová úloha</h1>
            <p>Bola vám priradená nová úloha</p>
          </div>
          <div class="content">
            <h2>Ahoj ${userName}!</h2>
            <p>Bola vám priradená nová úloha v portáli.</p>
            
            <div class="task-card">
              <h3>${taskTitle}</h3>
              <p><strong>Firma:</strong> ${companyName}</p>
              <p><strong>Popis:</strong> ${taskDescription}</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
              Zobraziť úlohu
            </a>
          </div>
          <div class="footer">
            <p>© 2024 Portal App. Všetky práva vyhradené.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  // Pripomienka termínu
  async sendDeadlineReminder(userEmail, userName, taskTitle, deadline, companyName) {
    const subject = `⏰ Pripomienka: Termín úlohy "${taskTitle}"`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ffc107; color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .deadline-card { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
          .urgent { border-left-color: #dc3545; background: #fff5f5; }
          .button { display: inline-block; background: #ffc107; color: #333; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Pripomienka termínu</h1>
            <p>Blíži sa termín úlohy</p>
          </div>
          <div class="content">
            <h2>Ahoj ${userName}!</h2>
            <p>Chceme vás upozorniť na blížiaci sa termín úlohy.</p>
            
            <div class="deadline-card">
              <h3>${taskTitle}</h3>
              <p><strong>Firma:</strong> ${companyName}</p>
              <p><strong>Termín:</strong> ${new Date(deadline).toLocaleDateString('sk-SK')}</p>
              <p><strong>Zostávajúce dni:</strong> ${Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))}</p>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
              Zobraziť úlohu
            </a>
          </div>
          <div class="footer">
            <p>© 2024 Portal App. Všetky práva vyhradené.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  // Notifikácia o novom dokumente
  async sendDocumentNotification(userEmail, userName, fileName, fileSize, fileType, companyName, uploadedBy) {
    const subject = `📄 Nový dokument: ${fileName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .document-card { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8; }
          .file-info { display: flex; align-items: center; margin: 10px 0; }
          .file-icon { font-size: 24px; margin-right: 10px; }
          .button { display: inline-block; background: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Nový dokument</h1>
            <p>Bol nahraný nový dokument do portálu</p>
          </div>
          <div class="content">
            <h2>Ahoj ${userName}!</h2>
            <p>Bol nahraný nový dokument do portálu, ktorý by vás mohol zaujímať.</p>
            
            <div class="document-card">
              <div class="file-info">
                <span class="file-icon">📄</span>
                <div>
                  <h3>${fileName}</h3>
                  <p><strong>Firma:</strong> ${companyName}</p>
                  <p><strong>Typ súboru:</strong> ${fileType}</p>
                  <p><strong>Veľkosť:</strong> ${this.formatFileSize(fileSize)}</p>
                  <p><strong>Nahral:</strong> ${uploadedBy}</p>
                  <p><strong>Dátum:</strong> ${new Date().toLocaleDateString('sk-SK')}</p>
                </div>
              </div>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
              Zobraziť dokument
            </a>
          </div>
          <div class="footer">
            <p>© 2024 Portal App. Všetky práva vyhradené.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  // Notifikácia o novej firme
  async sendCompanyNotification(userEmail, userName, companyName, ownerEmail, ico, contactEmail) {
    const subject = `🏢 Nová firma: ${companyName}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .company-card { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #6f42c1; }
          .company-info { margin: 10px 0; }
          .button { display: inline-block; background: #6f42c1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏢 Nová firma</h1>
            <p>Bola zaregistrovaná nová firma v portáli</p>
          </div>
          <div class="content">
            <h2>Ahoj ${userName}!</h2>
            <p>Bola zaregistrovaná nová firma v portáli, ktorá vyžaduje vašu pozornosť.</p>
            
            <div class="company-card">
              <div class="company-info">
                <h3>${companyName}</h3>
                <p><strong>IČO:</strong> ${ico}</p>
                <p><strong>Vlastník:</strong> ${ownerEmail}</p>
                <p><strong>Kontaktný email:</strong> ${contactEmail}</p>
                <p><strong>Dátum registrácie:</strong> ${new Date().toLocaleDateString('sk-SK')}</p>
              </div>
            </div>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" class="button">
              Zobraziť firmu
            </a>
          </div>
          <div class="footer">
            <p>© 2024 Portal App. Všetky práva vyhradené.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(userEmail, subject, html);
  }

  // Pomocná funkcia na odstránenie HTML tagov
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Pomocná funkcia na formátovanie veľkosti súboru
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new EmailService();
