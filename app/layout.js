import './globals.css';
import SiteNav from './components/SiteNav';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Cambodian Silk Archives',
  description:
    "Documenting Cambodia's rare, naturally golden raw silk (Tromol Meas) and its traditional lifecycle.",
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Cambodian Silk Archives',
    description:
      "Documenting Cambodia's rare, naturally golden raw silk (Tromol Meas) and its traditional lifecycle.",
    type: 'website',
    locale: 'en_KM',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteNav />
        {children}
        <Footer />
      </body>
    </html>
  );
}