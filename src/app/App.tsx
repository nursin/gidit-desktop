import React from "react";
import "../../styles/tailwind.css";
import { Toaster } from "./components/ui/toaster";
import { SettingsProvider } from "./context/settings-context";

type Props = {
  children?: React.ReactNode;
};

/**
 * App serves as the top-level layout wrapper for the renderer.
 * - Sets basic document metadata (title, description, favicon).
 * - Wraps UI in SettingsProvider.
 * - Renders the Toaster component.
 *
 * Note: Routing should be provided by the app entry (e.g. main.tsx using BrowserRouter).
 */
export default function App({ children }: Props) {
  React.useEffect(() => {
    document.title = "Gidit";

    const descriptionContent = "Your personal ADHD productivity studio.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = descriptionContent;

    const faviconData =
      "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3e%3crect width='24' height='24' rx='6' fill='%236d28d9' /%3e%3cpath d='M3.75 3.75H20.25V12.75C20.25 12.75 14.25 4.5 12 4.5C9.75 4.5 3.75 12.75 3.75 12.75V3.75Z' fill='white'/%3e%3ccircle cx='12' cy='15.75' r='1.5' fill='white'/%3e%3ccircle cx='12' cy='19.5' r='1.5' fill='white'/%3e%3c/svg%3e";
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = faviconData;
  }, []);

  return (
    <div className="font-sans antialiased min-h-screen">
      <SettingsProvider>{children}</SettingsProvider>
      <Toaster />
    </div>
  );
}
