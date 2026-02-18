"use client";


import CCAddRow from '@/components/client/CCAddRow';
import GCLoading from '@/components/global/GCLoading';
import { LockScrollProvider } from '@/context/LockScrollProvider';
import { roleFilter } from '@/utils/constants';
import Link from 'next/link';
import { useParams } from "next/navigation";
import { Fragment, useState } from 'react';
import { FiLock, FiUnlock } from 'react-icons/fi';

export default function RootLayout(props: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams<{role1: string}>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  if (isLoading) return <GCLoading />
  return (
    <Fragment>
      <div className='flex items-end justify-between gap-2 lg:gap-8 mt-12'>
        <div className='flex items-center flex-wrap gap-2'>
          { roleFilter.map((role, index) => (
              <Link
                key={index}
                href={role.href}
                className={
                  `${role.value === params.role1 ?
                    "bg-stone-50 border border-stone-600 text-stone-600" :
                    "bg-slate-100 border border-slate-100 text-slate-600"} 
                    text-sm px-4 py-1 mb-100 rounded-md
                  `}
              >
                {role.label}
              </Link>
          ))}
        </div>
        { params?.role1 &&
          <div className='flex gap-2 items-center justify-center'>
            <button
              className='text-slate-700 px-2 py-1 rounded-md'
              onClick={() => setIsLocked(!isLocked)}
            >
              { isLocked ?
                <FiLock size={22} /> :
                <FiUnlock size={22} />
              }
            </button>
            <CCAddRow toggleLoading={() => setIsLoading(!isLoading)} />
          </div>
        }
      </div>
      <div className='mb-2'></div>
      <LockScrollProvider lockScroll={isLocked}>
        {props.children}
      </LockScrollProvider>
    </Fragment>
  )
}
