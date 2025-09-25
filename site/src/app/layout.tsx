// site/src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SeeMe",
  description: "Landing",
};

// Renders SF on Apple devices, with good fallbacks elsewhere
const systemSans =
  'ui-sans-serif, system-ui, -apple-system, "SF Pro Text", "SF Pro Display", Helvetica,  "Segoe UI", Roboto, Arial, "Apple Color Emoji", "Segoe UI Emoji"';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: systemSans }}>
        <main>{children}</main>
      </body>
    </html>
  );
}
