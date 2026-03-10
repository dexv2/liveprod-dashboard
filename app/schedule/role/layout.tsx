"use client";

import CCAddRow from '@/components/client/CCAddRow';
import GCLoading from '@/components/global/GCLoading';
import { useDevice } from '@/context/DeviceProvider';
import { LockScrollProvider } from '@/context/LockScrollProvider';
import { roleFilter } from '@/utils/constants';
import Link from 'next/link';
import { useParams, useRouter } from "next/navigation";
import { Fragment, useState } from 'react';
import { FiLock, FiUnlock } from 'react-icons/fi';

export default function RootLayout(props: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams<{role1: string}>();
  const router = useRouter();
    const { isMobile } = useDevice();
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  if (isLoading) return <GCLoading />
  return (
    <Fragment>
      <div className='flex items-end justify-between gap-2 lg:gap-8 mt-12'>
        <div className='flex items-center flex-wrap gap-2'>
          { !isMobile ? (
            roleFilter.map((role, index) => (
              <Link
                key={index}
                href={role.href}
                className={
                  `${role.value === params.role1 || (!params.role1 && role.value === 'events') ?
                    "bg-slate-800 border border-slate-600 text-white" :
                    "bg-slate-100 text-slate-800"}
                    text-sm px-4 py-1 mb-100 rounded-md
                  `}
              >
                {role.label}
              </Link>
            ))) : (
              <select
                id='roles'
                value={params.role1}
                onChange={(e) => router.push(e.target.value)}
                className='bg-slate-800 border border-slate-600 text-white px-2 py-1 mb-100 rounded-md focus:outline-none'
              >
                { roleFilter.map((role, index) => (
                  <option
                    key={index}
                    value={role.value}
                  >
                    {role.label}
                  </option>
                ))}
              </select>
            )
          }
        </div>
        { params?.role1 &&
          <div className='flex gap-2 items-center justify-center'>
            <button
              className='text-white px-2 py-1 rounded-md'
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
