import Sidebar from "@/components/Sidebar";
import AdminPanel from "@/components/AdminPanel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        <AdminPanel />
        {children}
      </main>
    </div>
  );
}
