/**
 * Google Apps Script for Contact Form Submissions
 *
 * SETUP INSTRUCTIONS:
 *
 * 1. Create a new Google Sheet:
 *    - Go to https://sheets.google.com
 *    - Create a new spreadsheet
 *    - Name it "Contact Form Submissions" (or any name you prefer)
 *    - In Row 1, add these headers: Timestamp | First Name | Last Name | Email | Phone | Comment
 *
 * 2. Open the Script Editor:
 *    - In Google Sheets, go to Extensions > Apps Script
 *    - Delete any existing code in the editor
 *    - Paste this entire script
 *
 * 3. Configure the email address:
 *    - Update the NOTIFICATION_EMAIL variable below to: cameron@caspersons.com
 *
 * 4. Deploy as Web App:
 *    - Click "Deploy" > "New deployment"
 *    - Click the gear icon next to "Select type" and choose "Web app"
 *    - Set "Execute as" to "Me"
 *    - Set "Who has access" to "Anyone"
 *    - Click "Deploy"
 *    - Authorize the app when prompted (click through the security warnings)
 *    - Copy the Web App URL
 *
 * 5. Update your contact.html:
 *    - Find the line: const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
 *    - Replace 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' with your Web App URL
 *
 * 6. Test the form to ensure submissions appear in your sheet and you receive emails
 */

// ===== CONFIGURATION =====
const NOTIFICATION_EMAIL = 'cameron@caspersons.com';  // Email to receive notifications
const EMAIL_SUBJECT = 'New Contact Form Submission';   // Email subject line
// =========================

/**
 * Handles GET requests (for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Contact form handler is active' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handles POST requests from the contact form
 */
function doPost(e) {
  try {
    // Parse the incoming data
    const data = JSON.parse(e.postData.contents);

    // Get the active spreadsheet and sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();

    // Format timestamp for readability
    const timestamp = new Date(data.timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Append the data to the sheet
    sheet.appendRow([
      timestamp,
      data.firstName,
      data.lastName,
      data.email,
      data.phone || 'Not provided',
      data.comment
    ]);

    // Send email notification
    sendNotificationEmail(data, timestamp);

    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success', message: 'Form submitted successfully' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Log the error
    console.error('Error processing form submission:', error);

    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Sends an email notification for new form submissions
 */
function sendNotificationEmail(data, timestamp) {
  const fullName = `${data.firstName} ${data.lastName}`;

  // HTML email template
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1a1715;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: #4a6d5c;
          color: white;
          padding: 24px 32px;
          margin: -20px -20px 24px -20px;
        }
        .header h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 500;
        }
        .content {
          background: #faf8f5;
          padding: 24px;
          border-radius: 4px;
        }
        .field {
          margin-bottom: 16px;
        }
        .label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #7a7572;
          margin-bottom: 4px;
        }
        .value {
          font-size: 16px;
          color: #1a1715;
        }
        .message-box {
          background: white;
          border-left: 3px solid #4a6d5c;
          padding: 16px;
          margin-top: 8px;
        }
        .footer {
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e0dcd6;
          font-size: 13px;
          color: #7a7572;
        }
        .reply-btn {
          display: inline-block;
          background: #4a6d5c;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          margin-top: 16px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>New Contact Form Submission</h1>
      </div>

      <div class="content">
        <div class="field">
          <div class="label">Name</div>
          <div class="value">${fullName}</div>
        </div>

        <div class="field">
          <div class="label">Email</div>
          <div class="value"><a href="mailto:${data.email}">${data.email}</a></div>
        </div>

        <div class="field">
          <div class="label">Phone</div>
          <div class="value">${data.phone || 'Not provided'}</div>
        </div>

        <div class="field">
          <div class="label">Message</div>
          <div class="message-box">${data.comment.replace(/\n/g, '<br>')}</div>
        </div>

        <a href="mailto:${data.email}?subject=Re: Your inquiry" class="reply-btn">Reply to ${data.firstName}</a>
      </div>

      <div class="footer">
        Submitted on ${timestamp}
      </div>
    </body>
    </html>
  `;

  // Plain text version
  const plainBody = `
New Contact Form Submission

Name: ${fullName}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}

Message:
${data.comment}

---
Submitted on ${timestamp}
  `;

  // Send the email
  GmailApp.sendEmail(
    NOTIFICATION_EMAIL,
    `${EMAIL_SUBJECT} from ${fullName}`,
    plainBody,
    {
      htmlBody: htmlBody,
      replyTo: data.email,
      name: 'Website Contact Form'
    }
  );
}

/**
 * Test function - Run this to verify your setup
 * Go to Run > testSubmission to test
 */
function testSubmission() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+1 (555) 123-4567',
        comment: 'This is a test submission to verify the form is working correctly.',
        timestamp: new Date().toISOString()
      })
    }
  };

  const result = doPost(testData);
  console.log(result.getContent());
}
