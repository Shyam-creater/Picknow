
export const generateInvoiceHtml = (order: any) => {
  const date = new Date(order.createdAt).toLocaleDateString('en-IN');
  const downloadDate = new Date().toLocaleDateString('en-IN');
  
  const itemsHtml = order.items.map((item: any, index: number) => `
    <tr class="item-row">
      <td style="width: 40px;">${index + 1}</td>
      <td style="text-align: left;">${item.product?.pName || 'Product'}</td>
      <td style="width: 80px; text-align: right;">₹${item.price.toLocaleString('en-IN')}</td>
      <td style="width: 40px; text-align: center;">${item.quantity}</td>
      <td style="width: 100px; text-align: right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
            color: #111827;
            margin: 0;
            padding: 40px;
            font-size: 12px;
            position: relative;
            background: #fff;
          }
          .conic-decor {
            position: absolute;
            top: 0;
            right: 0;
            width: 180px;
            height: 180px;
            background: linear-gradient(225deg, rgba(243, 128, 0, 0.1) 0%, rgba(2, 132, 199, 0.1) 100%);
            clip-path: polygon(100% 0, 0 0, 100% 100%);
            z-index: -1;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            position: relative;
          }
          .logo {
            font-size: 32px;
            font-weight: 900;
            letter-spacing: -1px;
          }
          .pick { color: #0284C7; }
          .now { color: #F38000; }
          .tagline {
            font-size: 11px;
            color: #64748B;
            margin-top: 6px;
            font-weight: 500;
          }
          .invoice-title {
            text-align: right;
          }
          .invoice-title h1 {
            font-size: 28px;
            margin: 0;
            color: #1E293B;
            letter-spacing: 1px;
            font-weight: 900;
          }
          .meta-info {
            text-align: right;
            color: #475569;
            margin-top: 10px;
            font-weight: 500;
          }
          .address-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            border-top: 2px solid #F1F5F9;
            padding-top: 25px;
          }
          .address-box {
            width: 45%;
          }
          .address-label {
            font-weight: 900;
            color: #0284C7;
            text-transform: uppercase;
            margin-bottom: 10px;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          .address-text {
            color: #334155;
            line-height: 1.6;
            font-size: 12.5px;
          }
          .meta-box {
            background-color: #F8FAFC;
            padding: 18px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 35px;
            border-radius: 12px;
            border: 1px solid #E2E8F0;
          }
          .meta-item {
            color: #64748B;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 700;
          }
          .meta-item span {
            font-weight: 900;
            color: #111827;
            font-size: 13px;
            display: block;
            margin-top: 4px;
            text-transform: none;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 35px;
          }
          th {
            background-color: #1E293B;
            color: #FFFFFF;
            font-weight: 700;
            text-align: left;
            padding: 14px 10px;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 1px;
          }
          .item-row td {
            padding: 15px 10px;
            border-bottom: 1px solid #F1F5F9;
            color: #334155;
            font-size: 12px;
          }
          .summary-section {
            display: flex;
            justify-content: flex-end;
          }
          .summary-table {
            width: 280px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 5px;
            color: #64748B;
            font-weight: 500;
          }
          .summary-row.total {
            background: linear-gradient(90deg, #1E293B 0%, #334155 100%);
            padding: 15px 12px;
            margin-top: 15px;
            color: #FFFFFF;
            font-weight: 900;
            font-size: 18px;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .summary-row.total .value {
            color: #FFFFFF;
          }
          .value {
            color: #111827;
            font-weight: 700;
          }
          .footer {
            margin-top: 80px;
            text-align: center;
            border-top: 1px solid #E2E8F0;
            padding-top: 30px;
            color: #94A3B8;
            font-size: 11px;
            line-height: 1.5;
          }
          .thanks {
            font-size: 16px;
            font-weight: 900;
            color: #0284C7;
            margin-top: 20px;
            letter-spacing: -0.5px;
          }
        </style>
      </head>
      <body>
        <div class="conic-decor"></div>
        <div class="header">
          <div>
            <div class="logo">
              <span class="pick">Pick</span><span class="now">Now</span>
            </div>
            <div class="tagline">Quick Commerce - 100% Organic Products</div>
          </div>
          <div class="invoice-title">
            <h1>TAX INVOICE</h1>
            <div class="meta-info">
              <div>Invoice No: <strong>#PN-${order._id.slice(-6).toUpperCase()}</strong></div>
              <div>Order Date: ${date}</div>
              <div>Download Date: ${downloadDate}</div>
            </div>
          </div>
        </div>

        <div class="address-section">
          <div class="address-box">
            <div class="address-label">Sold By</div>
            <div class="address-text">
              <strong>PickNow Quick Commerce</strong><br>
              34, T M Nagar 1st Cross, Saravana Stores,<br>
              Mattuthavani, Madurai, TN - 625107<br>
              GSTIN: 33AABCXXXXX
            </div>
          </div>
          <div class="address-box">
            <div class="address-label">Billing Address</div>
            <div class="address-text">
              <strong>${order.shippingAddress.name || order.user?.name || 'Customer'}</strong><br>
              ${order.shippingAddress.address || 'N/A'}<br>
              ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} - ${order.shippingAddress.pincode || ''}<br>
              Contact: ${order.shippingAddress.contact || 'N/A'}
            </div>
          </div>
        </div>

        <div class="meta-box">
          <div class="meta-item">Order ID: <span>${order._id.toUpperCase()}</span></div>
          <div class="meta-item">Payment: <span>${order.paymentMethod}</span></div>
          <div class="meta-item">Status: <span>${order.paymentStatus}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Item Description</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Net Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary-section">
          <div class="summary-table">
            <div class="summary-row">
              <span>Subtotal</span>
              <span class="value">₹${order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="summary-row">
              <span>Shipping Charges</span>
              <span class="value">+₹${order.shippingCharges.toLocaleString('en-IN')}</span>
            </div>
            <div class="summary-row">
              <span>Platform Fee</span>
              <span class="value">+₹${order.platformFee.toLocaleString('en-IN')}</span>
            </div>
            ${order.useKaitCoins ? `
              <div class="summary-row" style="color: #10B981;">
                <span>KaitCoins Applied</span>
                <span>-₹${order.kaitCoinsUsed.toLocaleString('en-IN')}</span>
              </div>
            ` : ''}
            <div class="summary-row total">
              <span>Total Amount</span>
              <span>₹${order.finalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <div>This is a computer generated invoice and does not require a signature.</div>
          <div>Certified that the particulars given above are true and correct.</div>
          <div class="thanks">Thank you for shopping with PickNow!</div>
        </div>
      </body>
    </html>
  `;
};
