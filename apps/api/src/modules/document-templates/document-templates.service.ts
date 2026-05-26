import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DocumentTemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, type?: string) {
    const where: Record<string, unknown> = { organizationId };
    if (type) where.type = type;
    return this.prisma.documentTemplate.findMany({
      where,
      include: { _count: { select: { documents: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const template = await this.prisma.documentTemplate.findFirst({
      where: { id, organizationId },
    });
    if (!template) throw new NotFoundException('Şablon bulunamadı');
    return template;
  }

  async create(organizationId: string, data: Record<string, unknown>) {
    return this.prisma.documentTemplate.create({
      data: { organizationId, ...data } as Parameters<typeof this.prisma.documentTemplate.create>[0]['data'],
    });
  }

  async update(id: string, organizationId: string, data: Record<string, unknown>) {
    await this.findOne(id, organizationId);
    return this.prisma.documentTemplate.update({
      where: { id },
      data: data as Parameters<typeof this.prisma.documentTemplate.update>[0]['data'],
    });
  }

  async delete(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.documentTemplate.delete({ where: { id } });
  }

  async generateDocument(templateId: string, organizationId: string, data: {
    name: string;
    variables: Record<string, string>;
    entityType?: string;
    entityId?: string;
  }) {
    const template = await this.findOne(templateId, organizationId);
    const htmlContent = this.replaceVariables(template.htmlContent, data.variables);

    return this.prisma.generatedDocument.create({
      data: {
        templateId,
        organizationId,
        name: data.name,
        variables: data.variables,
        htmlContent,
        entityType: data.entityType,
        entityId: data.entityId,
      },
    });
  }

  async previewTemplate(id: string, organizationId: string, variables: Record<string, string>) {
    const template = await this.findOne(id, organizationId);
    return { html: this.replaceVariables(template.htmlContent, variables) };
  }

  async findDocuments(organizationId: string, params: { templateId?: string; entityType?: string }) {
    const where: Record<string, unknown> = { organizationId };
    if (params.templateId) where.templateId = params.templateId;
    if (params.entityType) where.entityType = params.entityType;
    return this.prisma.generatedDocument.findMany({
      where,
      include: { template: { select: { id: true, name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  private replaceVariables(html: string, variables: Record<string, string>): string {
    return html.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`);
  }

  getDefaultTemplates() {
    return [
      {
        type: 'invoice',
        name: 'Standart Fatura',
        description: 'Türkçe standart fatura şablonu',
        htmlContent: this.getInvoiceTemplate(),
        variables: [
          { key: 'companyName', label: 'Şirket Adı', type: 'text' },
          { key: 'invoiceNumber', label: 'Fatura No', type: 'text' },
          { key: 'invoiceDate', label: 'Fatura Tarihi', type: 'date' },
          { key: 'customerName', label: 'Müşteri Adı', type: 'text' },
          { key: 'totalAmount', label: 'Toplam Tutar', type: 'currency' },
        ],
      },
      {
        type: 'contract',
        name: 'Hizmet Sözleşmesi',
        description: 'Standart hizmet sözleşmesi şablonu',
        htmlContent: this.getContractTemplate(),
        variables: [
          { key: 'companyName', label: 'Şirket Adı', type: 'text' },
          { key: 'customerName', label: 'Müşteri/Karşı Taraf', type: 'text' },
          { key: 'startDate', label: 'Başlangıç Tarihi', type: 'date' },
          { key: 'endDate', label: 'Bitiş Tarihi', type: 'date' },
          { key: 'contractValue', label: 'Sözleşme Bedeli', type: 'currency' },
        ],
      },
    ];
  }

  private getInvoiceTemplate(): string {
    return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><title>Fatura - {{invoiceNumber}}</title>
<style>body{font-family:Arial,sans-serif;color:#333;padding:40px}
.header{display:flex;justify-content:space-between;margin-bottom:30px}
.company-name{font-size:24px;font-weight:bold;color:#1a56db}
.invoice-title{font-size:20px;font-weight:bold;text-align:right}
.invoice-meta{text-align:right;color:#666;font-size:14px}
.customer-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0}
table{width:100%;border-collapse:collapse;margin-top:20px}
th{background:#1a56db;color:white;padding:10px 12px;text-align:left}
td{padding:10px 12px;border-bottom:1px solid #e5e7eb}
.total-row{font-weight:bold;background:#f9fafb}
.footer{margin-top:40px;padding-top:20px;border-top:2px solid #e5e7eb;text-align:center;color:#666;font-size:12px}
</style></head>
<body>
<div class="header">
  <div><div class="company-name">{{companyName}}</div></div>
  <div><div class="invoice-title">FATURA</div>
  <div class="invoice-meta">No: {{invoiceNumber}}<br>Tarih: {{invoiceDate}}</div></div>
</div>
<div class="customer-box"><strong>Alıcı:</strong><br>{{customerName}}<br>{{customerAddress}}</div>
<table>
  <thead><tr><th>Ürün/Hizmet</th><th>Miktar</th><th>Birim Fiyat</th><th>KDV</th><th>Tutar</th></tr></thead>
  <tbody>{{#items}}<tr><td>{{description}}</td><td>{{quantity}}</td><td>{{unitPrice}} ₺</td><td>%{{vatRate}}</td><td>{{total}} ₺</td></tr>{{/items}}
  <tr class="total-row"><td colspan="4">TOPLAM</td><td>{{totalAmount}} ₺</td></tr>
  </tbody>
</table>
<div class="footer">Bu fatura elektronik olarak oluşturulmuştur. • {{companyName}} • {{companyAddress}}</div>
</body></html>`;
  }

  private getContractTemplate(): string {
    return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><title>Hizmet Sözleşmesi</title>
<style>body{font-family:"Times New Roman",serif;color:#333;padding:60px;line-height:1.8}
h1{text-align:center;font-size:20px;text-transform:uppercase;margin-bottom:30px}
.parties{display:flex;gap:40px;margin:20px 0}
.party{flex:1;background:#f9fafb;border:1px solid #e5e7eb;padding:16px;border-radius:8px}
.party-title{font-weight:bold;margin-bottom:8px}
.article{margin-bottom:20px}
.article-title{font-weight:bold;text-decoration:underline}
.signature-area{display:flex;justify-content:space-between;margin-top:60px}
.signature-box{text-align:center;border-top:1px solid #333;padding-top:10px;width:200px}
</style></head>
<body>
<h1>HİZMET SÖZLEŞMESİ</h1>
<div class="parties">
  <div class="party"><div class="party-title">HİZMET SAĞLAYAN</div>{{companyName}}<br>{{companyAddress}}</div>
  <div class="party"><div class="party-title">HİZMET ALAN</div>{{customerName}}<br>{{customerAddress}}</div>
</div>
<div class="article"><div class="article-title">MADDE 1 - KONU</div>
<p>İşbu sözleşme, {{companyName}} ("Hizmet Sağlayan") ile {{customerName}} ("Hizmet Alan") arasında, aşağıda belirtilen hizmetlerin sunulmasına ilişkin hak ve yükümlülükleri düzenlemektedir.</p></div>
<div class="article"><div class="article-title">MADDE 2 - SÜRE</div>
<p>Sözleşme süresi {{startDate}} tarihinde başlayıp {{endDate}} tarihinde sona erecektir.</p></div>
<div class="article"><div class="article-title">MADDE 3 - BEDEL</div>
<p>Hizmet bedeli {{contractValue}} TL + KDV olarak belirlenmiştir.</p></div>
<div class="article"><div class="article-title">MADDE 4 - ÖDEME KOŞULLARI</div>
<p>Ödeme aylık eşit taksitler halinde, her ayın 1. günü yapılacaktır.</p></div>
<div class="signature-area">
  <div class="signature-box">{{companyName}}<br><small>Hizmet Sağlayan</small></div>
  <div class="signature-box">{{customerName}}<br><small>Hizmet Alan</small></div>
</div>
</body></html>`;
  }
}
