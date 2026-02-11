import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import GCNavbar from "@/components/global/GCNavbar";
import SessionWrapper from "@/context/SessionWrapper";
import DeviceProvider from "@/context/DeviceProvider";
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

  return (
    <html lang="en">
      <body className={`${inter.className} background-gradient min-h-screen`}>
        <SessionWrapper>
          <DeviceProvider>
            <div className="mx-auto p-4">
              <GCNavbar />
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
          </DeviceProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
