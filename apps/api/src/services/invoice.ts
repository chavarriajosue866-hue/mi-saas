import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Invoice item structure
 */
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

/**
 * Create a new invoice (draft)
 */
export async function createInvoice(
  tenantId: string,
  userId: string,
  rfc: string,
  items: InvoiceItem[]
) {
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * 0.16; // 16% IVA (Mexico)
  const total = subtotal + tax;

  // Generate invoice number
  const invoiceNumber = `FAC-${Date.now()}`;

  return prisma.invoice.create({
    data: {
      tenantId,
      userId,
      invoiceNumber,
      rfc,
      amount: subtotal,
      tax,
      total,
      status: 'draft',
    },
  });
}

/**
 * Issue invoice (send to PAC for timbrado)
 * NOTE: This is a placeholder. In production, integrate with your PAC provider
 */
export async function issueInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status !== 'draft') {
    throw new Error('Invoice cannot be issued');
  }

  // TODO: Integrate with PAC provider (Finkok, SW Sapien, etc.)
  // This is where you would:
  // 1. Generate XML with invoice data
  // 2. Sign with CSD (Certificado de Sello Digital)
  // 3. Send to PAC for timbrado
  // 4. Receive UUID and stamped XML
  // 5. Generate PDF

  // Mock implementation for now
  const mockUUID = crypto.randomUUID();
  const mockXmlUrl = `http://localhost:3001/uploads/invoice-${invoiceId}.xml`;
  const mockPdfUrl = `http://localhost:3001/uploads/invoice-${invoiceId}.pdf`;

  // Update invoice status
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'issued',
      uuid: mockUUID,
      xmlUrl: mockXmlUrl,
      pdfUrl: mockPdfUrl,
      issuedAt: new Date(),
    },
  });

  return updatedInvoice;
}

/**
 * Cancel an invoice
 */
export async function cancelInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status !== 'issued') {
    throw new Error('Only issued invoices can be cancelled');
  }

  // TODO: Send cancellation request to PAC

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'cancelled',
    },
  });
}

/**
 * Get all invoices for a tenant
 */
export async function getInvoices(tenantId: string) {
  return prisma.invoice.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get invoice by ID
 */
export async function getInvoice(invoiceId: string) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
}