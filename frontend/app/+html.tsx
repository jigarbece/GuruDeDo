import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

// Root HTML document for every web page during static rendering.
// Loads brand Google Fonts (Poppins + Inter) and sets the page background
// to the soft cream from the logo.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>Gurudedo — Find the Right Teacher. Learn Any Skill.</title>
        <meta
          name="description"
          content="Find the perfect coach for any skill — near you, right now. Academics, music, dance, yoga, art, cooking, beauty, coding & more, all across India."
        />
        <meta name="theme-color" content="#5B2C8C" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: BASE_CSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const BASE_CSS = `
  html, body { background-color: #FFFBF5; }
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
  * { box-sizing: border-box; }
`;
