const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generate a beautiful, professional certificate PDF
 * @param {Object} certificateData - Certificate information
 * @param {Object} certificateData.user - User information
 * @param {Object} certificateData.course - Course information
 * @param {Object} certificateData.progress - Progress information
 * @param {Object} certificateData.certificate - Certificate record
 * @returns {PDFDocument} PDF document stream
 */
async function generatePremiumCertificate(certificateData) {
  const {user, course, progress, certificate, gradeData} = certificateData;

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 0,
    bufferPages: true
  });

  const width = doc.page.width;
  const height = doc.page.height;

  // ==================== BACKGROUND ====================
  
  // Gradient background effect
  doc.rect(0, 0, width, height)
     .fill('#ffffff');

  // Top left accent
  doc.save();
  doc.opacity(0.05);
  doc.circle(0, 0, 300)
     .fill('#8b5cf6');
  doc.opacity(0.03);
  doc.circle(0, 0, 400)
     .fill('#a78bfa');
  doc.restore();

  // Top right accent
  doc.save();
  doc.opacity(0.05);
  doc.circle(width, 0, 250)
     .fill('#ec4899');
  doc.opacity(0.03);
  doc.circle(width, 0, 350)
     .fill('#f472b6');
  doc.restore();

  // Bottom right accent
  doc.save();
  doc.opacity(0.05);
  doc.circle(width, height, 300)
     .fill('#3b82f6');
  doc.opacity(0.03);
  doc.circle(width, height, 400)
     .fill('#60a5fa');
  doc.restore();

  // ==================== DECORATIVE BORDER ====================
  
  // Outer border with gradient effect
  doc.lineWidth(8)
     .rect(25, 25, width - 50, height - 50)
     .stroke('#8b5cf6');

  doc.lineWidth(2)
     .rect(32, 32, width - 64, height - 64)
     .stroke('#a78bfa');

  doc.lineWidth(1)
     .rect(38, 38, width - 76, height - 76)
     .stroke('#c4b5fd');

  // Corner decorations
  const cornerSize = 40;
  const cornerMargin = 45;

  // Top-left corner
  doc.moveTo(cornerMargin, cornerMargin + cornerSize)
     .lineTo(cornerMargin, cornerMargin)
     .lineTo(cornerMargin + cornerSize, cornerMargin)
     .lineWidth(3)
     .strokeColor('#8b5cf6')
     .stroke();

  // Top-right corner
  doc.moveTo(width - cornerMargin - cornerSize, cornerMargin)
     .lineTo(width - cornerMargin, cornerMargin)
     .lineTo(width - cornerMargin, cornerMargin + cornerSize)
     .lineWidth(3)
     .strokeColor('#8b5cf6')
     .stroke();

  // Bottom-left corner
  doc.moveTo(cornerMargin, height - cornerMargin - cornerSize)
     .lineTo(cornerMargin, height - cornerMargin)
     .lineTo(cornerMargin + cornerSize, height - cornerMargin)
     .lineWidth(3)
     .strokeColor('#8b5cf6')
     .stroke();

  // Bottom-right corner
  doc.moveTo(width - cornerMargin - cornerSize, height - cornerMargin)
     .lineTo(width - cornerMargin, height - cornerMargin)
     .lineTo(width - cornerMargin, height - cornerMargin - cornerSize)
     .lineWidth(3)
     .strokeColor('#8b5cf6')
     .stroke();

  // ==================== HEADER SECTION ====================
  
  // Logo area (top center)
  const logoY = 60;
  
  // Create logo circle
  doc.save();
  doc.circle(width / 2, logoY, 35)
     .fillAndStroke('#8b5cf6', '#ffffff')
     .lineWidth(3);
  
  // Logo text/icon
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text('EK', width / 2 - 20, logoY - 10);
  doc.restore();

  // Platform name
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor('#8b5cf6')
     .text('EDUKANBAN', 0, logoY + 50, {
       align: 'center',
       width: width
     });

  // Decorative line under header
  doc.moveTo(width / 2 - 100, logoY + 80)
     .lineTo(width / 2 + 100, logoY + 80)
     .lineWidth(2)
     .strokeColor('#e9d5ff')
     .stroke();

  // ==================== MAIN TITLE ====================
  
  const titleY = 150;

  doc.fontSize(56)
     .font('Helvetica-Bold')
     .fillColor('#1f2937')
     .text('Certificate of Achievement', 0, titleY, {
       align: 'center',
       width: width
     });

  // Subtitle with decorative elements
  doc.fontSize(14)
     .font('Helvetica')
     .fillColor('#6b7280')
     .text('━━━━  This is to certify that  ━━━━', 0, titleY + 70, {
       align: 'center',
       width: width
     });

  // ==================== RECIPIENT NAME ====================
  
  const nameY = 250;
  const studentName = user.firstName ? `${user.firstName} ${user.lastName}` : user.username;

  doc.fontSize(44)
     .font('Helvetica-Bold')
     .fillColor('#8b5cf6')
     .text(studentName, 80, nameY, {
       align: 'center',
       width: width - 160
     });

  // Underline with decorative elements
  const underlineY = nameY + 55;
  doc.moveTo(width / 2 - 250, underlineY)
     .lineTo(width / 2 + 250, underlineY)
     .lineWidth(1.5)
     .strokeColor('#d8b4fe')
     .stroke();

  // Small decorative circles
  doc.circle(width / 2 - 255, underlineY, 4)
     .fill('#8b5cf6');
  doc.circle(width / 2 + 255, underlineY, 4)
     .fill('#8b5cf6');

  // ==================== ACHIEVEMENT TEXT ====================
  
  const achievementY = 330;

  doc.fontSize(14)
     .font('Helvetica')
     .fillColor('#4b5563')
     .text('has successfully completed the course', 0, achievementY, {
       align: 'center',
       width: width
     });

  // ==================== COURSE NAME ====================
  
  const courseY = 360;

  doc.fontSize(26)
     .font('Helvetica-Bold')
     .fillColor('#1f2937')
     .text(course.title, 100, courseY, {
       align: 'center',
       width: width - 200
     });

  // ==================== ACHIEVEMENT METRICS ====================
  
  const metricsY = 420;

  // Achievement percentage badge
  const percentageBoxX = width / 2 - 180;
  
  // Percentage box with gradient
  doc.roundedRect(percentageBoxX, metricsY, 120, 60, 8)
     .fillAndStroke('#f0fdf4', '#8b5cf6')
     .lineWidth(2);

  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor('#8b5cf6')
     .text(`${gradeData.percentage}%`, percentageBoxX, metricsY + 10, {
       width: 120,
       align: 'center'
     });

  doc.fontSize(11)
     .font('Helvetica')
     .fillColor('#6b7280')
     .text('Achievement', percentageBoxX, metricsY + 42, {
       width: 120,
       align: 'center'
     });

  // Grade box
  const gradeBoxX = width / 2 + 60;
  
  doc.roundedRect(gradeBoxX, metricsY, 120, 60, 8)
     .fillAndStroke('#fefce8', '#8b5cf6')
     .lineWidth(2);

  doc.fontSize(18)
     .font('Helvetica-Bold')
     .fillColor('#8b5cf6')
     .text(gradeData.grade, gradeBoxX, metricsY + 15, {
       width: 120,
       align: 'center'
     });

  doc.fontSize(11)
     .font('Helvetica')
     .fillColor('#6b7280')
     .text('Grade', gradeBoxX, metricsY + 42, {
       width: 120,
       align: 'center'
     });

  // ==================== COURSE DETAILS ====================
  
  const detailsY = 500;

  // Completion date
  const completionDate = new Date(progress.completedAt || progress.completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.fontSize(12)
     .font('Helvetica')
     .fillColor('#6b7280')
     .text(`Completed on ${completionDate}`, 0, detailsY, {
       align: 'center',
       width: width
     });

  // Duration if available
  if (course.estimatedDuration) {
    doc.fontSize(11)
       .text(`Course Duration: ${course.estimatedDuration}`, 0, detailsY + 20, {
         align: 'center',
         width: width
       });
  }

  // ==================== SIGNATURE SECTION ====================
  
  const signatureY = height - 140;
  const signatureWidth = 200;
  const leftSignatureX = width / 2 - 280;
  const rightSignatureX = width / 2 + 80;

  // Left signature (Platform)
  // Signature line
  doc.moveTo(leftSignatureX, signatureY)
     .lineTo(leftSignatureX + signatureWidth, signatureY)
     .lineWidth(1)
     .strokeColor('#d1d5db')
     .stroke();

  // Platform seal
  doc.circle(leftSignatureX + signatureWidth / 2, signatureY - 35, 25)
     .fillAndStroke('#8b5cf6', '#ffffff')
     .lineWidth(2);

  doc.fontSize(8)
     .font('Helvetica-Bold')
     .fillColor('#ffffff')
     .text('VERIFIED', leftSignatureX + signatureWidth / 2 - 22, signatureY - 40);

  // Signature text
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('#1f2937')
     .text('EduKanban Platform', leftSignatureX, signatureY + 8, {
       width: signatureWidth,
       align: 'center'
     });

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#6b7280')
     .text('Authorized Platform', leftSignatureX, signatureY + 25, {
       width: signatureWidth,
       align: 'center'
     });

  // Right signature (Date & Certificate ID)
  doc.moveTo(rightSignatureX, signatureY)
     .lineTo(rightSignatureX + signatureWidth, signatureY)
     .lineWidth(1)
     .strokeColor('#d1d5db')
     .stroke();

  const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor('#1f2937')
     .text(issueDate, rightSignatureX, signatureY + 8, {
       width: signatureWidth,
       align: 'center'
     });

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor('#6b7280')
     .text('Issue Date', rightSignatureX, signatureY + 25, {
       width: signatureWidth,
       align: 'center'
     });

  // ==================== QR CODE & VERIFICATION ====================
  
  try {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certificate.verificationCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 100,
      margin: 1,
      color: {
        dark: '#8b5cf6',
        light: '#ffffff'
      }
    });

    // QR code background
    const qrX = width - 130;
    const qrY = height - 130;

    doc.roundedRect(qrX - 5, qrY - 5, 110, 110, 8)
       .fillAndStroke('#f9fafb', '#e5e7eb')
       .lineWidth(1);

    // QR code image
    doc.image(qrCodeDataUrl, qrX, qrY, {
      width: 100,
      height: 100
    });

    // QR code label
    doc.fontSize(8)
       .font('Helvetica')
       .fillColor('#6b7280')
       .text('Scan to Verify', qrX, qrY + 110, {
         width: 100,
         align: 'center'
       });

  } catch (qrError) {
    console.error('QR code generation error:', qrError);
  }

  // ==================== CERTIFICATE ID ====================
  
  const footerY = height - 50;

  // Certificate ID with icon
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor('#9ca3af')
     .text(`◆  Certificate ID: ${certificate.certificateId}  ◆`, 60, footerY, {
       align: 'left'
     });

  // ==================== FOOTER ====================
  
  // Website and verification text
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor('#9ca3af')
     .text('This certificate can be verified at edukanban.com/verify', 0, height - 30, {
       align: 'center',
       width: width - 150
     });

  // Decorative footer line
  doc.moveTo(60, height - 60)
     .lineTo(width - 150, height - 60)
     .lineWidth(0.5)
     .strokeColor('#e5e7eb')
     .stroke();

  return doc;
}

module.exports = { generatePremiumCertificate };
