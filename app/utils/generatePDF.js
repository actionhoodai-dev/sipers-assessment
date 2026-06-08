import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function generatePDF(childInfo, answers, sections) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const colors = {
    primary: [37, 99, 235],
    secondary: [15, 23, 42],
    tableHeader: [37, 99, 235],
    tableHeaderText: [255, 255, 255],
    altRow: [241, 245, 249],
    white: [255, 255, 255],
    textMuted: [100, 116, 139],
    border: [226, 232, 240],
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const childName = childInfo.childName || 'Unknown';
  const fileDate = today.toISOString().slice(0, 10).replace(/-/g, '');

  // ── Header ──────────────────────────────────────────────────────
  function drawHeader() {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...colors.primary);
    doc.text('SIPERS', marginLeft, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...colors.secondary);
    doc.text('Social Interaction and Peer Engagement Rating Scale', marginLeft, 33);

    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, 37, pageWidth - marginRight, 37);

    doc.setFontSize(9);
    doc.setTextColor(...colors.textMuted);
    doc.text(`Date Generated: ${dateStr}`, pageWidth - marginRight, 33, { align: 'right' });
  }

  drawHeader();

  let currentY = 45;

  // ── Section Heading ─────────────────────────────────────────────
  function drawSectionHeading(text, y) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...colors.secondary);
    doc.text(text, marginLeft, y);
    return y + 3;
  }

  // ── Child Information ───────────────────────────────────────────
  currentY = drawSectionHeading('Child Information', currentY);

  const childFields = [
    ['Patient ID', childInfo.patientId || ''],
    ['Child Name', childInfo.childName || ''],
    ['Age', childInfo.age || ''],
    ['Gender', childInfo.gender || ''],
    ['Diagnosis', childInfo.diagnosis || ''],
    ['Socio Economic Status', childInfo.ses || ''],
    ['Location Type', childInfo.locationType || ''],
    ['Family Type', childInfo.familyType || ''],
    ['Birth Order', childInfo.birthOrder || ''],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Field', 'Details']],
    body: childFields,
    margin: { left: marginLeft, right: marginRight },
    theme: 'grid',
    headStyles: {
      fillColor: colors.tableHeader,
      textColor: colors.tableHeaderText,
      fontStyle: 'bold',
      fontSize: 9.5,
      cellPadding: 3.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3.2,
      textColor: colors.secondary,
    },
    alternateRowStyles: {
      fillColor: colors.altRow,
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: contentWidth - 55 },
    },
    styles: {
      lineColor: colors.border,
      lineWidth: 0.3,
    },
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // ── Questionnaire Sections ──────────────────────────────────────
  const sectionLetters = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' };

  sections.forEach((section) => {
    const letter = sectionLetters[section.id] || section.id.toUpperCase();
    const heading = `${letter}. ${section.title}`;

    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = 20;
    }

    currentY = drawSectionHeading(heading, currentY);

    const tableBody = section.questions.map((q, idx) => {
      const qNum = `${letter}${idx + 1}`;
      const qText = q.text;
      const response = answers[q.id] || 'Not answered';
      return [qNum, qText, response];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['No.', 'Question', 'Response']],
      body: tableBody,
      margin: { left: marginLeft, right: marginRight },
      theme: 'grid',
      headStyles: {
        fillColor: colors.tableHeader,
        textColor: colors.tableHeaderText,
        fontStyle: 'bold',
        fontSize: 9.5,
        cellPadding: 3.5,
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8.5,
        cellPadding: 3,
        textColor: colors.secondary,
        valign: 'middle',
      },
      alternateRowStyles: {
        fillColor: colors.altRow,
      },
      columnStyles: {
        0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: contentWidth - 50 },
        2: { cellWidth: 34, halign: 'center' },
      },
      styles: {
        lineColor: colors.border,
        lineWidth: 0.3,
        overflow: 'linebreak',
      },
    });

    currentY = doc.lastAutoTable.finalY + 10;
  });



  // ── Page Numbers ────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.textMuted);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // ── Save ────────────────────────────────────────────────────────
  const safeId = (childInfo.patientId || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
  const safeName = childName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`SIPERS_Assessment_${safeId}_${safeName}_${fileDate}.pdf`);
}
