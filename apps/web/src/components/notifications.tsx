"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCircle, Clock, AlertCircle, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Notification {
  id: string;
  type: "invoice_pending" | "invoice_overdue" | "appointment_soon";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // Update cada 5 minutos
    const interval = setInterval(fetchNotifications, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [invoicesRes, appointmentsRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/appointments"),
      ]);

      const invoices = await invoicesRes.json();
      const appointments = await appointmentsRes.json();

      const newNotifications: Notification[] = [];

      // Invoices vencidas
      const overdueInvoices = invoices.filter((inv: any) => inv.status === "overdue");
      overdueInvoices.forEach((inv: any) => {
        newNotifications.push({
          id: `overdue-${inv.id}`,
          type: "invoice_overdue",
          title: "Overdue Invoice",
          message: `La factura ${inv.invoiceId} de $${inv.amount} is overdue since ${inv.dueDate}`,
          date: inv.dueDate,
          read: false,
        });
      });

      // Invoices pendientes (solo las más recientes)
      const pendingInvoices = invoices.filter((inv: any) => inv.status === "pending").slice(0, 3);
      pendingInvoices.forEach((inv: any) => {
        newNotifications.push({
          id: `pending-${inv.id}`,
          type: "invoice_pending",
          title: "Pending Invoice",
          message: `Invoice ${inv.invoiceId} de $${inv.amount} pending payment`,
          date: inv.date,
          read: false,
        });
      });

      // Appointments próximas
      const today = new Date().toISOString().split("T")[0];
      const todayAppointments = appointments.filter((apt: any) => apt.day === 1); // Día 1 = hoy
      todayAppointments.forEach((apt: any) => {
        newNotifications.push({
          id: `appointment-${apt.id}`,
          type: "appointment_soon",
          title: "Upcoming Appointment",
          message: `${apt.title} with ${apt.client} at ${apt.time}`,
          date: apt.date || today,
          read: false,
        });
      });

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getIwith = (type: string) => {
    switch (type) {
      case "invoice_overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "invoice_pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "appointment_soon":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="iwith" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-red-500 hover:bg-red-600">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="font-semibold text-sm">Notificaciones</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  !notification.read ? "bg-muted/50" : ""
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="mt-0.5">{getIwith(notification.type)}</div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.date).toLocaleDateString("es-ES")}
                  </p>
                </div>
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}