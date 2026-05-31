export default function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="lecturer-dashboard-container">
      {children}
    </section>
  );
}
