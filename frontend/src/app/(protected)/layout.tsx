import { ProtectedNav } from "@/components/protected-nav";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <ProtectedNav />
      <div className="flex-1">{children}</div>
    </div>
  );
}
