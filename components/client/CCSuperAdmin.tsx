"use client";

import { Admin } from '@/app/super-admin/page';
import { putUpdateAdmin } from '@/utils/apis/put';
import { PERMISSIONS } from '@/utils/constants';
import {  useMemo, useState } from 'react';
import { toast } from 'react-toastify';

export default function CCSuperAdmin({ admin, fetchAdmins }: { admin: Admin, fetchAdmins: () => Promise<void> }) {
  const [ adminPermissions, setAdminPermissions ] = useState<string[]>(admin.permissions || []);

  const isDetailsUpdated = useMemo(() => {
    return adminPermissions.length !== (admin?.permissions ?? []).length;
  }, [adminPermissions, admin.permissions])

  const toggleAdminPermissions = (value: string) => {
    if (!adminPermissions.includes(value)) {
      setAdminPermissions((prev) => prev.concat(value))
    } else {
      setAdminPermissions((prev) => (prev.filter((p) => p !== value)));
    }
  }

  const updateAdmin = async () => {
    const toastUpdatingId = toast.info('Updating admin...');
    await putUpdateAdmin(admin._id, {permissions: adminPermissions});
    await fetchAdmins();
    toast.dismiss(toastUpdatingId);
    toast.success('Admin updated!', {autoClose: 2000});
  }

  return (
    <div className="border border-slate-500 rounded-lg bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between bg-slate-800 w-full rounded-t-lg px-3.5 py-3.5">
        <h3 className="font-semibold text-lg text-white">
          {admin.username}
        </h3>
        {admin.superAdmin && <h3 className="text-md text-orange-400">
          Super Admin
        </h3>}
      </div>
      <div className='p-4'>
        <div className="mb-4 p-4 bg-gray-50 rounded">
          <h4 className="text-md font-medium mb-2">Permissions:</h4>
          <div className="space-y-2 grid grid-cols-1 lg:grid-cols-2">
            { PERMISSIONS.map((permission, i) => (
              <div
                key={i}
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => toggleAdminPermissions(permission.value)}
              >
                <input
                  type="checkbox"
                  checked={adminPermissions.includes(permission.value)}
                  onChange={() => toggleAdminPermissions(permission.value)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm">{permission.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className='flex justify-end'>
          <button
            disabled={!isDetailsUpdated}
            onClick={updateAdmin}
            className={`${isDetailsUpdated ? 'cursor-pointer' : 'opacity-50'} bg-sky-600 text-white pl-3.5 pr-4 rounded-md py-0.5`}
          >
            <div className="flex gap-1.5 justify-center">
              <div className="flex flex-col justify-center">
                Save Changes
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}