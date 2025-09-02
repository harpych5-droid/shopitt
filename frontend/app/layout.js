import './globals.css'

export const metadata = {
  title: 'shopitt',
  description: 'Your app description',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}