import './globals.css';

export const metadata = {
  title: 'CoRide — share the ride, split the cost',
  description: 'Daily carpool matching for commuters.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
