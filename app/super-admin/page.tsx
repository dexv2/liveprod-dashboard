"use client";

import CCSuperAdmin from '@/components/client/CCSuperAdmin';
import { getAllAdmins } from '@/utils/apis/get';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export interface Admin {
  _id: string
  username: string
  superAdmin: boolean
  permissions: string[]
}

export default function SuperAdmin() {
  const router = useRouter();
  const { data: session } = useSession();
  const [ admins, setAdmins ] = useState<Admin[]>([]);

  const isSuperAdmin = useMemo(() => {
    return !!session?.user?.superAdmin;
  }, [session]);

  const userName = useMemo(() => {
    console.log(session?.user?.username)
    return session?.user?.username;
  }, [session]);

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/');
    }
  }, [router, isSuperAdmin]);

  useEffect(() => {
    fetchAdmins();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdmins = async () => {
    const res = await getAllAdmins();
    setAdmins((res?.data || []).reduce((acc: Admin[], adm: Admin) => (adm.username === userName ? acc.unshift(adm) : acc.push(adm), acc), []));
  }

  return (
    <div className="px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-white">Admin List</h1>
        <h2 className="text-lg text-white font-medium">{admins.length} admins</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        { admins.map((admin) => (
          <CCSuperAdmin key={admin._id} admin={admin} fetchAdmins={fetchAdmins} />
        ))}
      </div>
    </div>
  );
}
