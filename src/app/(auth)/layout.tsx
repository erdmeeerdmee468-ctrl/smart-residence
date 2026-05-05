export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#04060b] text-white">
      {children}
    </main>
  );
}
