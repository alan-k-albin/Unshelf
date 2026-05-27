import './globals.css';
import SessionInitializer from '@/components/SessionInitializer';

export const metadata = {
  title: 'Unshelf',
  description: 'Buy, sell, or exchange academic resources',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionInitializer />
        {children}
      </body>
    </html>
  );
}
