import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  async generateInvoicePdf(invoice: {
    invoiceNumber: string;
    issueDate: Date;
    dueDate?: Date;
    customer: { name: string; email?: string; taxNumber?: string; address?: Record<string, unknown> };
    organization: { name: string; slug: string };
    items: Array<{ description: string; quantity: number; unitPrice: number; taxRate: number; totalPrice: number }>;
    totalAmount: number;
    taxAmount: number;
    netAmount: number;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(invoice.organization.name, 50, 50);
      doc.fontSize(10).font('Helvetica').fillColor('#666').text('ERP System', 50, 75);

      // Invoice title
      doc.fillColor('#000').fontSize(16).font('Helvetica-Bold').text('FATURA', 400, 50, { align: 'right' });
      doc.fontSize(10).font('Helvetica').text(`No: ${invoice.invoiceNumber}`, 400, 72, { align: 'right' });
      doc.text(`Tarih: ${new Date(invoice.issueDate).toLocaleDateString('tr-TR')}`, 400, 86, { align: 'right' });
      if (invoice.dueDate) {
        doc.text(`Vade: ${new Date(invoice.dueDate).toLocaleDateString('tr-TR')}`, 400, 100, { align: 'right' });
      }

      // Divider
      doc.moveTo(50, 130).lineTo(545, 130).strokeColor('#ddd').stroke();

      // Customer info
      doc.fillColor('#000').fontSize(10).font('Helvetica-Bold').text('Müşteri:', 50, 145);
      doc.font('Helvetica').text(invoice.customer.name, 50, 160);
      if (invoice.customer.email) doc.text(invoice.customer.email, 50, 175);
      if (invoice.customer.taxNumber) doc.text(`VKN: ${invoice.customer.taxNumber}`, 50, 190);

      // Items table header
      const tableTop = 230;
      doc.fillColor('#f5f5f5').rect(50, tableTop, 495, 20).fill();
      doc.fillColor('#000').fontSize(9).font('Helvetica-Bold');
      doc.text('Açıklama', 55, tableTop + 5);
      doc.text('Miktar', 300, tableTop + 5, { width: 60, align: 'right' });
      doc.text('Birim Fiyat', 365, tableTop + 5, { width: 75, align: 'right' });
      doc.text('KDV%', 445, tableTop + 5, { width: 40, align: 'right' });
      doc.text('Toplam', 490, tableTop + 5, { width: 55, align: 'right' });

      // Items
      let y = tableTop + 25;
      doc.font('Helvetica').fontSize(9);
      for (const item of invoice.items) {
        doc.fillColor('#000').text(item.description, 55, y, { width: 240 });
        doc.text(String(item.quantity), 300, y, { width: 60, align: 'right' });
        doc.text(`${Number(item.unitPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 365, y, { width: 75, align: 'right' });
        doc.text(`%${item.taxRate}`, 445, y, { width: 40, align: 'right' });
        doc.text(`${Number(item.totalPrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 490, y, { width: 55, align: 'right' });
        y += 20;
        doc.moveTo(50, y - 3).lineTo(545, y - 3).strokeColor('#eee').stroke();
      }

      // Totals
      y += 10;
      doc.fontSize(9).font('Helvetica');
      doc.text('Ara Toplam:', 380, y);
      doc.text(`${Number(invoice.totalAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 490, y, { width: 55, align: 'right' });
      y += 18;
      doc.text('KDV:', 380, y);
      doc.text(`${Number(invoice.taxAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 490, y, { width: 55, align: 'right' });
      y += 18;
      doc.moveTo(380, y).lineTo(545, y).strokeColor('#000').stroke();
      y += 8;
      doc.font('Helvetica-Bold').fontSize(11);
      doc.text('TOPLAM:', 380, y);
      doc.text(`${Number(invoice.netAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 490, y, { width: 55, align: 'right' });

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#999').text('Bu belge ERP System tarafından otomatik oluşturulmuştur.', 50, 750, { align: 'center', width: 495 });

      doc.end();
    });
  }
}
