import "./globals.css";
export const metadata = { title: "Elite Dashboard", description: "iGaming Operations Dashboard" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
