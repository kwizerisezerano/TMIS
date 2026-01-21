const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
  }
});

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Membership application endpoint
router.post('/apply', upload.single('document'), async (req, res) => {
  try {
    const { names, email, phone, reason } = req.body;
    const document = req.file;
    
    // Validate required fields
    if (!names || !email || !phone || !document) {
      return res.status(400).json({ 
        message: 'All fields are required including document upload' 
      });
    }
    
    // Validate names (at least 2 words)
    if (names.trim().split(' ').length < 2) {
      return res.status(400).json({ 
        message: 'Please provide your full names (first and last name)' 
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }
    
    // Validate phone number (Rwanda format)
    const phoneRegex = /^(078|079|072|073)\d{7}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      return res.status(400).json({ 
        message: 'Please provide a valid Rwandan phone number (078XXXXXXX)' 
      });
    }
    
    // Admin emails (The Future leadership)
    const adminEmails = [
      'tabitakwizerisezerano@gmail.com',
      'kwizerisezerano@gmail.com', 
      'kwizerisezerano250@gmail.com'
    ];
    
    console.log('Attempting to send email to:', adminEmails);
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmails,
      subject: '🌱 New Membership Application - The Future',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🌱 The Future</h1>
            <p style="color: #d1fae5; margin: 5px 0 0 0; font-size: 16px;">New Membership Application</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px; background: #ffffff;">
            <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
              <h2 style="color: #065f46; margin: 0 0 10px 0; font-size: 20px;">New Application Received</h2>
              <p style="color: #047857; margin: 0; font-size: 14px;">Please review the following membership application</p>
            </div>
            
            <!-- Applicant Info -->
            <div style="background: #f9fafb; padding: 25px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #10b981; padding-bottom: 8px;">Applicant Information</h3>
              <div style="display: grid; gap: 10px;">
                <p style="margin: 5px 0; color: #4b5563;"><strong style="color: #1f2937;">Full Names:</strong> ${names}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong style="color: #1f2937;">Email:</strong> ${email}</p>
                <p style="margin: 5px 0; color: #4b5563;"><strong style="color: #1f2937;">Phone:</strong> ${phone}</p>
                ${reason ? `<p style="margin: 15px 0 5px 0; color: #4b5563;"><strong style="color: #1f2937;">Reason for joining:</strong><br><em style="color: #6b7280;">${reason}</em></p>` : ''}
              </div>
            </div>
            
            <!-- Document Info -->
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 16px;">
                <strong>📄 Document Attached:</strong><br>
                <span style="font-family: monospace; background: #fff; padding: 4px 8px; border-radius: 4px; margin-top: 5px; display: inline-block;">${document.originalname}</span>
                <span style="color: #a16207; font-size: 14px; margin-left: 10px;">(${(document.size / 1024).toFixed(1)} KB)</span>
              </p>
            </div>
            
            <!-- Action Required -->
            <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin: 0 0 10px 0;">Action Required</h4>
              <p style="color: #1e3a8a; margin: 0;">Please review the application and contact the applicant directly to proceed with the membership process.</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-radius: 0 0 10px 10px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Application submitted on ${new Date().toLocaleString('en-US', { 
              timeZone: 'Africa/Kigali',
              year: 'numeric',
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })} (Kigali Time)</p>
            <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 12px;">The Future Tontine | Founded at Runda on 14/01/2024</p>
          </div>
        </div>
      `,
      attachments: [{
        filename: document.originalname,
        content: document.buffer
      }]
    };
    
    // Send email
    console.log('Sending email with transporter...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    
    res.json({ 
      success: true,
      message: 'Application submitted successfully. Admins have been notified.' 
    });
    
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ 
      message: 'Failed to submit application. Please try again.' 
    });
  }
});

module.exports = router;