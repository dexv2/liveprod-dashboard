"use client";

import CCAddRow from "@/components/client/CCAddRow";
import GCLoading from '@/components/global/GCLoading';
import { roleFilter } from '@/utils/constants';
import Link from 'next/link';
import { useParams } from "next/navigation";
import { Fragment, useState } from 'react';

export default function RootLayout(props: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams<{role1: string}>();
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) return <GCLoading />
  return (
    <Fragment>
      <div className='flex items-center justify-between mt-11'>
        <div className='flex items-center gap-2'>
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
        <CCAddRow toggleLoading={() => setIsLoading(!isLoading)} />
      </div>
      <div className='mb-2'></div>
      {props.children}
    </Fragment>
  )
}
