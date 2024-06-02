'use client';

import { type ElementRef, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { AiOutlineClose } from "react-icons/ai";

export function Modal({ children, title }: { children: React.ReactNode, title: string }) {
  const router = useRouter();
  const dialogRef = useRef<ElementRef<'dialog'>>(null);

  useEffect(() => {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, []);

  function onDismiss() {
    router.back();
  }

  return createPortal(
    <div className="absolute bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-[1000] inset-0">
      <dialog ref={dialogRef} className="w-4/5 max-w-[450px] h-auto max-h-[550px] relative flex justify-between flex-col rounded-xl focus:outline-none" onClose={onDismiss}>
        <div className="flex justify-between">
          <p className="h-12 bg-transparent flex items-center justify-center font-medium text-xl text-slate-700 pl-4">
            {title}
          </p>
          <button onClick={onDismiss} className="w-12 h-12 bg-transparent cursor-pointer flex items-center text-slate-700 justify-center font-medium text-2xl rounded-xl hover:bg-slate-200 focus:outline-none">
            <AiOutlineClose />
          </button>
        </div>
        {children}
        <div className="h-5" />
      </dialog>
    </div>,
    document.getElementById('modal-root')!
  );
}
