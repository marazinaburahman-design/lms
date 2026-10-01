const money = (n, cur = 'LKR') =>
  `${cur} ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

exports.invoiceEmail = ({ academyName = 'Demo Academy', student, invoice }) => {
  const rows = [
    ['Invoice Number', invoice.invoiceNo],
    ['Invoice Date', new Date(invoice.createdAt).toLocaleDateString('en-GB')],
    ['Total', money(invoice.total, invoice.currency)],
    ['Paid', money(invoice.paidAmount, invoice.currency)],
    ['Balance', money(invoice.balance, invoice.currency)],
  ];

  const rowsHtml = rows
    .map(
      ([label, value], i) => `
      <tr>
        <td style="padding:12px 0;color:#94a3b8;font-size:14px;${i ? 'border-top:1px solid #334155;' : ''}">${label}</td>
        <td align="right" style="padding:12px 0;color:#f1f5f9;font-size:14px;font-weight:bold;${i ? 'border-top:1px solid #334155;' : ''}">${value}</td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px 0;background:#1f2326;font-family:Arial,Helvetica,sans-serif;">
  <table align="center" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#111111;border-radius:16px;overflow:hidden;">
    <tr>
      <td align="center" style="padding:16px;color:#ffffff;font-weight:bold;font-size:16px;">${academyName}</td>
    </tr>
    <tr>
      <td align="center" style="background:#e8651f;background-image:linear-gradient(135deg,#dc2626,#fbbf24);padding:40px 24px;border-radius:16px;">
        <div style="color:#ffffff;font-size:26px;font-weight:bold;">Invoice Approved</div>
        <div style="color:#ffffff;font-size:14px;margin-top:8px;">${invoice.invoiceNo}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:28px 28px 8px;color:#e2e8f0;font-size:15px;line-height:1.6;">
        Dear <b>${student.firstName} ${student.lastName}</b>,<br><br>
        Your invoice has been approved. The PDF copy is attached to this email.
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px 0;color:#ef4444;font-size:12px;font-weight:bold;letter-spacing:1px;">INVOICE DETAILS</td>
    </tr>
    <tr>
      <td style="padding:12px 28px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1d20;border:1px solid #334155;border-radius:12px;padding:8px 20px;">
          ${rowsHtml}
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding:0 28px 28px;color:#64748b;font-size:12px;">
        Thank you for choosing ${academyName}.
      </td>
    </tr>
  </table>
</body>
</html>`;
};