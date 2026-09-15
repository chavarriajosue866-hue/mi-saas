"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Mail, UserPlus, Clock } from "lucide-react";
import { toast } from "sonner";

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  inviter: {
    name: string;
    email: string;
  };
  createdAt: string;
  expiresAt: string;
}

export default function TeamPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRolee, setInviteRolee] = useState("member");

  const fetchInvitations = async () => {
    try {
      const res = await fetch("/api/invitations");
      if (res.ok) {
        const data = await res.json();
        setInvitations(data);
      }
    } catch (error) {
      toast.error("Error loading invitations");
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast.error("Ingresa un email");
      return;
    }

    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRolee
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Invitation sent a ${inviteEmail}`);
        setIsDialogOpen(false);
        setInviteEmail("");
        setInviteRolee("member");
        fetchInvitations();
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Error sending invitation");
    }
  };

  const getRoleeBadge = (role: string) => {
    if (role === "admin") {
      return <Badge className="bg-purple-100 text-purple-700">Admin</Badge>;
    }
    return <Badge variant="outline">Member</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-700">Accepted</Badge>;
      case "expired":
        return <Badge className="bg-gray-100 text-gray-700">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage your team members
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Invite member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Team Members</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No invitations sent</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setIsDialogOpen(true)}
              >
                Invite the first member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{inv.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited by {inv.inviter.name || inv.inviter.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getRoleeBadge(inv.role)}
                    {getStatusBadge(inv.status)}
                    {inv.status === "pending" && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              Enter the email of the person you want to invite
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={inviteRolee} onValueChange={setInviteRolee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite}>
              <UserPlus className="mr-2 h-4 w-4" /> Send invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}