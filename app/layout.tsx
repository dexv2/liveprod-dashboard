import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import GCNavbar from "@/components/global/GCNavbar";
import SessionWrapper from "@/components/global/SessionWrapper";
import { auth } from "@/auth";
import { Bounce, ToastContainer } from "react-toastify";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Live Prod Dashboard",
  description: "This is the scheduling dashboard for the live production team.",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout(props: Readonly<{
  modal: React.ReactNode;
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={`${inter.className} background-gradient min-h-screen`}>
        <SessionWrapper session={session}>
          <div className="mx-auto p-4">
            <GCNavbar session={session} />
            <div className="">
              {props.modal}
              {props.children}
            </div>
            <div id="modal-root" />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
              transition={Bounce}
            />
          </div>
        </SessionWrapper>
      </body>
    </html>
  );
}
