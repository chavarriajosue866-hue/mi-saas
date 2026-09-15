"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileText, Plus, Search, Edit, Trash2, Download, DollarSign, CheckCircle, Clock, AlertCircle, MoreVertical, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Invoice {
  id: string;
  invoiceId: string;
  client: string;
  amount: number;
  date: string;
  dueDate: string;
  status: string;
  description?: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  const [formData, setFormData] = useState({
    client: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: "",
    status: "pending",
    description: "",
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      } else {
        toast.error("Error loading invoices");
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="mr-1 h-3 w-3" /> Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-700"><AlertCircle className="mr-1 h-3 w-3" /> Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.client || !formData.amount) {
      toast.error("Client and amount are required");
      return;
    }

    try {
      const url = editingInvoice ? `/api/invoices/${editingInvoice.id}` : "/api/invoices";
      const method = editingInvoice ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount) || 0,
        }),
      });

      if (res.ok) {
        toast.success(editingInvoice ? "Invoice updated" : "Invoice created");
        setIsDialogOpen(false);
        setEditingInvoice(null);
        setFormData({
          client: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          dueDate: "",
          status: "pending",
          description: "",
        });
        fetchInvoices();
      } else {
        toast.error("Error saving invoice");
      }
    } catch (error) {
      toast.error("Connection error");
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      client: invoice.client,
      amount: invoice.amount.toString(),
      date: invoice.date,
      dueDate: invoice.dueDate,
      status: invoice.status,
      description: invoice.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Invoice deleted");
        fetchInvoices();
      } else {
        toast.error("Error deleting invoice");
      }
    } catch (error) {
      toast.error("Connection error");
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${invoice.invoiceId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("PDF downloaded");
      } else {
        toast.error("Error generating PDF");
      }
    } catch (error) {
      toast.error("Connection error");
    }
  };

  // ✅ FUNCIÓN PARA EXPORTAR A CSV
  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.error("No invoices to export");
      return;
    }

    // Headers del CSV
    const headers = ["Invoice ID", "Client", "Amount", "Date", "Due Date", "Status", "Description"];
    
    // Convertir datos a filas CSV
    const rows = filteredInvoices.map((invoice) => [
      invoice.invoiceId,
      invoice.client,
      invoice.amount.toString(),
      new Date(invoice.date).toLocaleDateString(),
      new Date(invoice.dueDate).toLocaleDateString(),
      invoice.status,
      invoice.description || "",
    ]);

    // Crear contenido CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => 
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredInvoices.length} invoices to CSV`);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = 
      invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totals = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amount, 0),
    pending: invoices.filter((i) => i.status === "pending").reduce((sum, i) => sum + i.amount, 0),
    overdue: invoices.filter((i) => i.status === "overdue").reduce((sum, i) => sum + i.amount, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage and track your invoices</p>
        </div>
        <Button onClick={() => {
          setEditingInvoice(null);
          setFormData({
            client: "",
            amount: "",
            date: new Date().toISOString().split("T")[0],
            dueDate: "",
            status: "pending",
            description: "",
          });
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> New Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totals.total}</div>
            <p className="text-xs text-muted-foreground">All invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totals.paid.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Received</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${totals.pending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totals.overdue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client or invoice ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            {/* ✅ BOTÓN EXPORTAR CSV */}
            <Button variant="outline" onClick={handleExportCSV} disabled={filteredInvoices.length === 0}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading invoices...</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" ? "No invoices match your filters" : "No invoices yet"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create your first invoice
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="font-mono text-sm">{invoice.invoiceId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{invoice.client}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">${invoice.amount.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(invoice)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(invoice.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingInvoice ? "Edit Invoice" : "New Invoice"}</DialogTitle>
            <DialogDescription>
              {editingInvoice ? "Update invoice details" : "Create a new invoice for your client"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Client *</Label>
              <Input
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                placeholder="Client name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Invoice description (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate}>
              {editingInvoice ? "Save Changes" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}