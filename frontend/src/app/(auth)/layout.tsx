import ScrollToTop from "./scroll-to-top";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      <ScrollToTop />
      {children}
    </section>
  );
}
