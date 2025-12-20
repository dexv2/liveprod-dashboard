'use client';

import { type ElementRef, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { AiOutlineClose } from "react-icons/ai";

export default function GCModal({ children, title, childClass }: { children: React.ReactNode, title: string, childClass: string }) {
  const router = useRouter();
  const dialogRef = useRef<ElementRef<'dialog'>>(null);

  useEffect(() => {
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    document.body.style.overflow = 'hidden';

    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }

    // Cleanup: restore scroll when modal unmounts
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  function onDismiss() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    router.back();
  }

  return createPortal(
    <div className="fixed bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-[1000] inset-0 p-4">
      <dialog ref={dialogRef} className={`${childClass} w-full h-auto flex justify-between flex-col rounded-xl focus:outline-none"`} onClose={onDismiss}>
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
