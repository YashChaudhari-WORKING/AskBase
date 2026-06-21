import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AskBase — AI Customer Support",
  description: "AI-first customer support platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            gap={8}
            toastOptions={{
              style: {
                background: "rgba(14,14,18,0.92)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.88)",
                borderRadius: "16px",
                fontSize: "13.5px",
                fontWeight: "450",
                padding: "14px 16px",
                minWidth: "300px",
                letterSpacing: "-0.01em",
              },
              classNames: {
                title: "font-semibold text-white/90",
                description: "text-white/45 text-[12.5px] mt-0.5",
                success: "border-emerald-500/20 shadow-emerald-500/5",
                error: "border-red-500/20 shadow-red-500/5",
                loading: "border-indigo-500/20 shadow-indigo-500/5",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
