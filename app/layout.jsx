import './globals.css';

export const metadata = {
  title: 'Thiệp Cưới: Vũ Đức An & Đinh Thị Bích Thủy 💕',
  description: 'Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của Vũ Đức An & Đinh Thị Bích Thủy',
  openGraph: {
    title: 'Vũ Đức An & Đinh Thị Bích Thủy - Save The Date',
    description: 'Trân trọng kính mời bạn đến chung vui trong ngày trọng đại của chúng mình!',
    images: ['/photos/DSC_1220.jpg'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Dancing+Script:wght@600;700&family=EB+Garamond:ital,wght@0,500;0,600;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
