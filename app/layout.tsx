import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";

const arabic = IBM_Plex_Sans_Arabic({ variable: "--font-arabic", subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "رِفادة — النموذج الأولي",
  description: "رِفادة: حماية فورية لضيوف المملكة — تأمين بارامتري فوري للفعاليات الكبرى والتجمعات الحاشدة يُفعَّل بالرصد الذكي — نموذج أولي لبرمجان التأمين 2026، نخبة حلول الأعمال.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
