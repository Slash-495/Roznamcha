import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50/50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="mx-auto max-w-6xl p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
