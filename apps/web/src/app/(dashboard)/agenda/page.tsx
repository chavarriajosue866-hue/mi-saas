"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Clock, User, Trash2, Edit, Video, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: string;
  title: string;
  client: string;
  time: string;
  duration: string;
  type: string;
  day: number; // 0 = Monday, 6 = Sunday
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AgendaPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    client: "",
    time: "09:00",
    duration: "1h",
    type: "meeting",
    day: 0,
  });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const data = await res.json();
        setAppointments(data);
      } else {
        toast.error("Error loading schedule");
      }
    } catch (error) {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "call": return <Video className="h-4 w-4 text-blue-600" />;
      case "deadline": return <FileText className="h-4 w-4 text-red-600" />;
      default: return <User className="h-4 w-4 text-green-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "call": return <Badge className="bg-blue-100 text-blue-700">Call</Badge>;
      case "deadline": return <Badge className="bg-red-100 text-red-700">Deadline</Badge>;
      default: return <Badge className="bg-green-100 text-green-700">Meeting</Badge>;
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.title || !formData.client) {
      toast.error("Title and Client are required");
      return;
    }

    try {
      const url = editingAppointment ? `/api/appointments/${editingAppointment.id}` : "/api/appointments";
      const method = editingAppointment ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingAppointment ? "Appointment updated" : "Appointment created");
        setIsDialogOpen(false);
        setEditingAppointment(null);
        setFormData({ title: "", client: "", time: "09:00", duration: "1h", type: "meeting", day: 0 });
        fetchAppointments();
      } else {
        toast.error("Error saving appointment");
      }
    } catch (error) {
      toast.error("Connection error");
    }
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      title: appointment.title,
      client: appointment.client,
      time: appointment.time,
      duration: appointment.duration,
      type: appointment.type,
      day: appointment.day,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Appointment deleted");
        fetchAppointments();
      } else {
        toast.error("Error deleting appointment");
      }
    } catch (error) {
      toast.error("Connection error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">Manage your appointments and meetings</p>
        </div>
        <Button onClick={() => {
          setEditingAppointment(null);
          setFormData({ title: "", client: "", time: "09:00", duration: "1h", type: "meeting", day: 0 });
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> New Appointment
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground">Loading schedule...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-7">
          {DAYS.map((day, index) => {
            const dayAppointments = appointments.filter((a) => a.day === index);
            return (
              <Card key={day} className="min-h-[400px]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>{SHORT_DAYS[index]}</span>
                    <span className="text-xs font-normal text-muted-foreground">{dayAppointments.length}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dayAppointments.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No appointments</p>
                  ) : (
                    dayAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => handleEdit(appointment)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(appointment.type)}
                            <span className="text-sm font-medium truncate">{appointment.title}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(appointment.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {appointment.time} ({appointment.duration})
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {appointment.client}
                          </div>
                          <div className="mt-2">
                            {getTypeBadge(appointment.type)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingAppointment ? "Edit Appointment" : "New Appointment"}</DialogTitle>
            <DialogDescription>
              {editingAppointment ? "Update appointment details" : "Schedule a new appointment or meeting"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Project review, Client call..."
              />
            </div>
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
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Duration</Label>
                <Select value={formData.duration} onValueChange={(val) => setFormData({ ...formData, duration: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30m">30 minutes</SelectItem>
                    <SelectItem value="1h">1 hour</SelectItem>
                    <SelectItem value="1h 30m">1h 30m</SelectItem>
                    <SelectItem value="2h">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Day</Label>
                <Select value={formData.day.toString()} onValueChange={(val) => setFormData({ ...formData, day: parseInt(val) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHORT_DAYS.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>{DAYS[index]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrUpdate}>
              {editingAppointment ? "Save Changes" : "Create Appointment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}