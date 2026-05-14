import jsPDF from 'jspdf';

/**
 * Generates and downloads a parking receipt PDF.
 * Called after payment is verified or receipt is fetched.
 */
export const generateReceipt = (receiptData) => {
  const doc = new jsPDF();

  // ── Colors ────────────────────────────────────────────────────
  const blue  = [26, 115, 232];
  const dark  = [15, 23, 42];
  const gray  = [100, 116, 139];
  const light = [248, 250, 252];

  // ── Header ────────────────────────────────────────────────────
  doc.setFillColor(...blue);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ParkEase', 15, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Parking Platform', 15, 26);
  doc.text('PAYMENT RECEIPT', 150, 18, { align: 'left' });

  // ── Receipt number ─────────────────────────────────────────────
  doc.setTextColor(...dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `Receipt: ${receiptData.receiptNumber || `PKSE-${receiptData.paymentId}`}`,
    15, 55
  );

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...gray);
  doc.text(
    `Generated: ${new Date(receiptData.generatedAt || Date.now()).toLocaleString('en-IN')}`,
    15, 63
  );

  // ── Divider ────────────────────────────────────────────────────
  doc.setDrawColor(226, 232, 240);
  doc.line(15, 70, 195, 70);

  // ── Payment details table ─────────────────────────────────────
  const rows = [
    ['Payment ID',          `#${receiptData.paymentId}`],
    ['Booking ID',          `#${receiptData.bookingId}`],
    ['Transaction ID',      receiptData.razorpayPaymentId || receiptData.transactionId || '—'],
    ['Razorpay Order ID',   receiptData.razorpayOrderId  || '—'],
    ['Payment Mode',        receiptData.mode             || '—'],
    ['Currency',            receiptData.currency || 'INR'],
    ['Paid At',             receiptData.paidAt
      ? new Date(receiptData.paidAt)
          .toLocaleString('en-IN')
      : '—',
    ],
    ['Status',              receiptData.status || 'PAID'],
  ];

  let y = 80;
  doc.setFontSize(9);

  rows.forEach(([label, value], idx) => {
    if (idx % 2 === 0) {
      doc.setFillColor(...light);
      doc.rect(15, y - 5, 180, 10, 'F');
    }
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 20, y);
    doc.setTextColor(...dark);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), 105, y);
    y += 12;
  });

  // ── Amount box ────────────────────────────────────────────────
  y += 5;
  doc.setFillColor(...blue);
  doc.roundedRect(15, y, 180, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount Paid', 25, y + 13);
  doc.text(
    `INR ${receiptData.amount?.toFixed(2) || '0.00'}`,
    185, y + 13, { align: 'right' }
  );

  // ── Footer ────────────────────────────────────────────────────
  y += 35;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y, 195, y);

  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'This is a system-generated receipt. No signature required.',
    105, y + 8, { align: 'center' }
  );
  doc.text(
    'For support: official.parkease@gmail.com | www.parkease.com',
    105, y + 15, { align: 'center' }
  );

  // ── Save ──────────────────────────────────────────────────────
  doc.save(
    `ParkEase-Receipt-${receiptData.receiptNumber || receiptData.paymentId}.pdf`
  );
};