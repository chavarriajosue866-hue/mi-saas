import { ReactNode } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LayoutDashboard, Calendar, Users, FileText, FolderKanban, Settings, Search, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Notifications } from "@/components/notifications";
import { ClientToaster } from "@/components/client-toaster";
import { AIAssistant } from "@/components/ai-assistant";
import { ThemeToggle } from "@/components/theme-toggle";

const sidebarLinks = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/agenda", icon: Calendar, label: "Schedule" },
  { href: "/clientes", icon: Users, label: "Clients" },
  { href: "/facturas", icon: FileText, label: "Invoices" },
  { href: "/proyectos", icon: FolderKanban, label: "Projects" },
  { href: "/equipo", icon: Users, label: "Team" },
  { href: "/configuracion", icon: Settings, label: "Settings" },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "user@example.com";
 const userImage = (session?.user as any)?.image || `https://ui-avatars.com/api/?name=${userName}&background=0D8ABC&color=fff`;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="hidden w-64 flex-col border-r bg-white dark:bg-gray-950 md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <span className="text-xl font-bold text-primary">My SaaS</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {sidebarLinks.map((link) => (
            <Link key={link.href} href={link.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50">
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userImage} />
              <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium truncate max-w-[150px]">{userName}</span>
              <span className="text-xs text-gray-500 truncate max-w-[150px]">{userEmail}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-gray-950">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input type="search" placeholder="Search..." className="w-64 pl-8" />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Notifications />
            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none">
                <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarImage src={userImage} />
                  <AvatarFallback>{userName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">My Account</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/configuracion">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600" asChild>
                  <Link href="/api/auth/signout">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      
      <ClientToaster />
      <AIAssistant />
    </div>
  );
}