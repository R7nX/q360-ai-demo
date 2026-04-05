import { EmployeeSidebar } from "@/components/ai/employee/EmployeeSidebar";

export default function EmployeeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.10),_transparent_35%),linear-gradient(180deg,#f7faf8_0%,#eef6f1_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col md:flex-row">
        <EmployeeSidebar />
        <main className="flex min-h-screen flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
