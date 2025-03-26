import "./globals.css";
import { Inter, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
});

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});

export const metadata: Metadata = {
	title: "AIGrader",
	description: "Automatisk provrättning med AI",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="sv">
			<body className={`${inter.variable} ${geistMono.variable} antialiased`}>
				{children}
			</body>
		</html>
	);
}
