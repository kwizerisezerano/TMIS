const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'fysf nmuw urto gsue',
    pass: process.env.EMAIL_PASS || 'fysf nmuw urto gsue'
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendVerificationEmail = async (email, code, customSubject = null) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@thefuture.rw',
    to: email,
    subject: customSubject || 'Verify Your The Future Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🏦 The Future - Account Verification</h2>
        <p>Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code expires in 1 minute.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
};

const sendLoanEmail = async (email, loanData) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@thefuture.rw',
    to: email,
    subject: 'Loan Approval - The Future Tontine',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🏦 The Future - Loan Approval</h2>
        <p>Dear ${loanData.userName},</p>
        <p>Congratulations! Your loan request has been approved.</p>
        
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p><strong>Loan ID:</strong> #${loanData.loanId}</p>
          <p><strong>Approved Amount:</strong> RWF ${loanData.amount}</p>
          <p><strong>Interest Rate:</strong> 1.7% per month</p>
          <p><strong>Repayment Period:</strong> 6 months maximum</p>
        </div>
        
        <p>Please contact the tontine administrator to arrange loan disbursement and discuss repayment schedule.</p>
        
        <p>Thank you for being a valued member of The Future Tontine.</p>
        
        <p>Best regards,<br>The Future Tontine Executive Committee</p>
        
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Loan email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Loan email send failed:', error);
    return false;
  }
};

const sendAdminLoanNotification = async (email, loanData, retryCount = 0) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@thefuture.rw',
    to: email,
    subject: 'Loan Request Processed - The Future Tontine',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🏦 The Future - Loan Notification</h2>
        <p>A loan request has been processed successfully.</p>
        
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <p><strong>Member:</strong> ${loanData.userName}</p>
          <p><strong>Loan ID:</strong> #${loanData.loanId}</p>
          <p><strong>Amount:</strong> RWF ${loanData.amount}</p>
          <p><strong>Status:</strong> Approved</p>
        </div>
        
        <p>Please arrange disbursement with the member.</p>
        
        <p>Best regards,<br>The Future Tontine System</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Admin loan notification sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Admin notification failed:', error);
    
    // Retry up to 2 times with delay
    if (retryCount < 2) {
      console.log(`Retrying admin email (attempt ${retryCount + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return sendAdminLoanNotification(email, loanData, retryCount + 1);
    }
    
    return false;
  }
};

const sendEmail = async (email, subject, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@thefuture.rw',
    to: email,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🌱 The Future</h1>
          <p style="color: #d1fae5; margin: 5px 0 0 0; font-size: 16px;">Digital Tontine Management System</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px; background: #ffffff;">
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
            <h2 style="color: #065f46; margin: 0 0 10px 0; font-size: 20px;">Welcome to Our Community!</h2>
            <p style="color: #047857; margin: 0; font-size: 14px;">Your account has been successfully created</p>
          </div>
          
          <div style="white-space: pre-line; line-height: 1.6; color: #374151; font-size: 16px;">${message}</div>
          
          <!-- Login Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/login" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Login to Dashboard</a>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; margin: 0; font-size: 14px;">The Future Tontine | Founded at Runda on 14/01/2024</p>
          <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
};

const sendPenaltyEmail = async (email, penaltyData) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@thefuture.rw',
    to: email,
    subject: 'Penalty Applied - The Future Tontine',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ Penalty Applied</h1>
          <p style="margin: 5px 0 0 0; font-size: 16px;">The Future Tontine</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${penaltyData.userName},</p>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-weight: bold;">A penalty has been applied to your account:</p>
            <p style="margin: 10px 0 0 0; color: #856404;"><strong>Amount:</strong> RWF ${penaltyData.amount}</p>
            <p style="margin: 5px 0 0 0; color: #856404;"><strong>Reason:</strong> ${penaltyData.reason}</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">Please settle this penalty as soon as possible to maintain your good standing in The Future tontine.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3001/login" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              💳 Pay Penalty Now
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">The Future Tontine Management</p>
        </div>
      </div>
    `
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Penalty email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Penalty email send failed:', error);
    return false;
  }
};

module.exports = { sendVerificationEmail, sendLoanEmail, sendAdminLoanNotification, sendEmail, sendPenaltyEmail };