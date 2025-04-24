'use client';

import { type ElementRef, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { AiOutlineClose } from "react-icons/ai";

export default function GCModal({ children, title, maxHeight }: { children: React.ReactNode, title: string, maxHeight: string }) {
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
      <dialog ref={dialogRef} className={`${maxHeight} w-4/5 max-w-[450px] h-auto relative flex justify-between flex-col rounded-xl focus:outline-none"`} onClose={onDismiss}>
        <div className="flex justify-between bg-slate-900 py-1">
          <p className="h-12 flex items-center justify-center font-medium text-xl text-white pl-4">
            {title}
          </p>
          <button onClick={onDismiss} className="w-12 h-12 cursor-pointer flex items-center text-white justify-center font-medium text-2xl rounded-xl hover:bg-slate-700 focus:outline-none">
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
