"use client";
import "react-toastify/dist/ReactToastify.css";

import { Bounce, ToastContainer } from "react-toastify";

export default function ToastProvider() {
  return (
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
      style={{zIndex: 9999}}
    />
  );
}