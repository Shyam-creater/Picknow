export const generateEmailTemplate = ({
  title,
  greetingName,
  mainContent,
  otpBox = null,
  orderBox = null,
  portalName = "User Portal",
  portalSubtitle = "Account Notifications",
  supportEmail = "support@picknow.in"
}) => {
  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title} - Picknow</title></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">

  <!-- HEADER -->
  <tr><td style="background:#0d2137;padding:28px 40px;text-align:center;">
    <div style="font-size:26px;font-weight:700;color:#F5C842;letter-spacing:3px;">PICKNOW</div>
    <div style="font-size:11px;color:#7a9bbf;letter-spacing:3px;margin-top:4px;text-transform:uppercase;">${portalName}</div>
    <div style="display:inline-block;background:#F5C842;color:#0d2137;font-size:10px;font-weight:700;letter-spacing:2px;padding:4px 14px;border-radius:20px;margin-top:14px;text-transform:uppercase;">${portalSubtitle}</div>
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:36px 40px;background:#ffffff;">

    <div style="font-size:18px;font-weight:700;color:#212121;border-left:4px solid #F5C842;padding-left:14px;margin-bottom:24px;line-height:1.5;">
      ${title}
    </div>

    <p style="font-size:15px;color:#212121;line-height:1.7;margin:0 0 24px;">
      Dear <strong>${greetingName || 'User'}</strong>,<br><br>
      ${mainContent}
    </p>

    ${otpBox ? `
    <!-- OTP BOX -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d2137;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:28px;text-align:center;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#7a9bbf;margin-bottom:14px;">${otpBox.title || 'Verification Code'}</div>
        <div style="font-family:'Courier New',monospace;font-size:40px;font-weight:700;color:#F5C842;letter-spacing:10px;">${otpBox.code}</div>
        <div style="margin-top:14px;font-size:12px;color:#7a9bbf;">⏱ ${otpBox.footer || 'This code expires in 10 minutes'}</div>
      </td></tr>
    </table>
    
    <!-- INFO BULLETS -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:10px;border:1px solid #eeeeee;margin-bottom:24px;">
      <tr><td style="padding:18px 20px;">
        <table width="100%">
          <tr><td style="padding:5px 0;">
            <table><tr>
              <td style="vertical-align:top;padding-right:10px;padding-top:5px;"><div style="width:6px;height:6px;border-radius:50%;background:#F5C842;"></div></td>
              <td style="font-size:13px;color:#212121;line-height:1.6;">${otpBox.instructions || 'Enter this code to continue.'}</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:5px 0;">
            <table><tr>
              <td style="vertical-align:top;padding-right:10px;padding-top:5px;"><div style="width:6px;height:6px;border-radius:50%;background:#F5C842;"></div></td>
              <td style="font-size:13px;color:#212121;line-height:1.6;">Do not share this code with anyone — Picknow staff will never request it from you.</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:5px 0;">
            <table><tr>
              <td style="vertical-align:top;padding-right:10px;padding-top:5px;"><div style="width:6px;height:6px;border-radius:50%;background:#F5C842;"></div></td>
              <td style="font-size:13px;color:#212121;line-height:1.6;">If you did not initiate this, you can safely ignore this email.</td>
            </tr></table>
          </td></tr>
        </table>
      </td></tr>
    </table>
    ` : ''}

    ${orderBox ? `
    <!-- ORDER BOX -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d2137;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:28px;text-align:center;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#7a9bbf;margin-bottom:14px;">Order ID</div>
        <div style="font-family:'Courier New',monospace;font-size:24px;font-weight:700;color:#F5C842;letter-spacing:2px;margin-bottom:14px;">#${orderBox.orderId}</div>
        ${orderBox.amount ? `<div style="font-size:16px;color:#ffffff;">Total Amount: <span style="font-weight:700;color:#F5C842;">₹${orderBox.amount}</span></div>` : ''}
      </td></tr>
    </table>
    ` : ''}

    <hr style="border:none;border-top:1px solid #eeeeee;margin:0 0 20px;">
    <p style="font-size:12px;color:#888;text-align:center;margin:0;">
      Questions or need help?<br>
      Email us at <strong>${supportEmail}</strong> — we're happy to help.
    </p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td style="background:#0d2137;padding:20px 40px;text-align:center;">
    <p style="font-size:11px;color:#7a9bbf;margin:3px 0;">© ${new Date().getFullYear()} Picknow Quick Commerce. All rights reserved.</p>
    <p style="font-size:11px;color:#7a9bbf;margin:3px 0;">34, T M Nagar 1st Cross, Mattuthavani, Madurai, TN - 625107</p>
    <p style="font-size:11px;color:#4a6a8a;margin:10px 0 0;">Picknow Delivery Program</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
};
