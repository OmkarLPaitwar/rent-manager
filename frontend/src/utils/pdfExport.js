import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// jsPDF built-in fonts (Helvetica) do NOT support the ₹ Unicode character.
// It renders as ¹ or a box. Fix: use "Rs." prefix which renders perfectly.
const rs = (amount) => `Rs. ${Number(amount).toLocaleString('en-IN')}`;

export const generateMonthlyPDF = (summaryData, propertyName) => {
  const { month, year, rents, expenses, lightBill, summary } = summaryData;
  const doc = new jsPDF();
  const monthName = MONTHS[month - 1];

  // ── Header bar ──────────────────────────────────────────────
  doc.setFillColor(30, 58, 110);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(propertyName, 14, 14);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${monthName} ${year}  |  Monthly Report`, 14, 24);

  doc.setTextColor(0, 0, 0);
  let y = 42;

  // ── Rent Received ───────────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 110);
  doc.text('Rent Received', 14, y);
  y += 5;
  doc.setTextColor(0, 0, 0);

  const rentRows = rents.map(r => [
    r.tenantName,
    new Date(r.date).toLocaleDateString('en-IN'),
    r.paymentMethod,
    rs(r.amount)
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Tenant', 'Date', 'Method', 'Amount']],
    body: rentRows,
    foot: [['', '', 'Total', rs(summary.totalRent)]],
    headStyles: { fillColor: [30, 58, 110], fontSize: 10, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    footStyles: { fillColor: [232, 237, 248], textColor: [30, 58, 110], fontStyle: 'bold', fontSize: 10 },
    columnStyles: { 3: { halign: 'right' } },
    theme: 'grid',
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 14;

  // ── Expenses ─────────────────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 60, 60);
  doc.text('Expenses', 14, y);
  y += 5;
  doc.setTextColor(0, 0, 0);

  const expenseRows = expenses.map(e => [
    e.title,
    new Date(e.date).toLocaleDateString('en-IN'),
    e.category,
    rs(e.amount)
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Date', 'Category', 'Amount']],
    body: expenseRows.length > 0 ? expenseRows : [['No expenses', '', '', 'Rs. 0']],
    foot: [['', '', 'Total', rs(summary.totalExpenses)]],
    headStyles: { fillColor: [180, 60, 60], fontSize: 10, fontStyle: 'bold' },
    bodyStyles: { fontSize: 10 },
    footStyles: { fillColor: [255, 243, 243], textColor: [180, 60, 60], fontStyle: 'bold', fontSize: 10 },
    columnStyles: { 3: { halign: 'right' } },
    theme: 'grid',
    margin: { left: 14, right: 14 }
  });

  y = doc.lastAutoTable.finalY + 14;

  // ── Light Bill ───────────────────────────────────────────────
  if (lightBill && lightBill.entries?.length > 0) {
    // Page break check
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 120, 60);
    doc.text('Light Bill Calculation', 14, y);
    y += 5;
    doc.setTextColor(0, 0, 0);

    const billRows = lightBill.entries.map(e => [
      e.unitLabel,
      String(e.previousReading),
      String(e.currentReading),
      String(e.unitsConsumed),
      `Rs.${e.ratePerUnit}/unit`,
      rs(e.amount)
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Unit', 'Prev', 'Current', 'Units', 'Rate', 'Amount']],
      body: billRows,
      foot: [['', '', '', String(lightBill.totalUnits), '', rs(lightBill.totalAmount)]],
      headStyles: { fillColor: [40, 120, 60], fontSize: 10, fontStyle: 'bold' },
      bodyStyles: { fontSize: 10 },
      footStyles: { fillColor: [237, 250, 243], textColor: [40, 120, 60], fontStyle: 'bold', fontSize: 10 },
      columnStyles: { 5: { halign: 'right' } },
      theme: 'grid',
      margin: { left: 14, right: 14 }
    });

    y = doc.lastAutoTable.finalY + 14;
  }

  // ── Summary box ──────────────────────────────────────────────
  if (y > 240) { doc.addPage(); y = 20; }

  const balPos = (summary.balance >= 0);
  const balColor = balPos ? [40, 120, 60] : [180, 60, 60];
  const boxBg = balPos ? [237, 250, 243] : [255, 243, 243];

  doc.setFillColor(...boxBg);
  doc.roundedRect(14, y, 182, 44, 3, 3, 'F');
  doc.setDrawColor(200, 210, 230);
  doc.roundedRect(14, y, 182, 44, 3, 3, 'S');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 110);
  doc.text('Summary', 20, y + 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);

  doc.text('Total Rent Received:', 22, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 120, 60);
  doc.text(rs(summary.totalRent), 185, y + 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Total Expenses:', 22, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 60, 60);
  doc.text(rs(summary.totalExpenses), 185, y + 28, { align: 'right' });

  doc.setDrawColor(200, 210, 230);
  doc.line(22, y + 33, 192, y + 33);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('Remaining Balance:', 22, y + 40);
  doc.setTextColor(...balColor);
  doc.text(`${balPos ? '+' : '-'}${rs(Math.abs(summary.balance))}`, 185, y + 40, { align: 'right' });

  // ── Footer ───────────────────────────────────────────────────
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const today = new Date().toLocaleDateString('en-IN');
  doc.text(`Generated on ${today}  |  Rent & Expense Manager`, 14, 289);
  doc.text(propertyName, 196, 289, { align: 'right' });

  doc.save(`${propertyName.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`);
};
