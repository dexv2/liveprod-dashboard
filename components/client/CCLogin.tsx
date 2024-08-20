"use client";

import { useEffect, useState } from "react";
import GCInputTextWithLabel from "@/components/global/GCInputTextWithLabel";
import { toast } from "react-toastify";

interface Login {
  (username: FormDataEntryValue | null, password: FormDataEntryValue | null): Promise<void>;
}

export default function CCLogin({ error, login }: { error: number, login: Login }) {
  const [ loading, setLoading ] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error('Invalid username or password!');
      setLoading(false);
    }
  }, [error])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await login(formData.get("username"), formData.get("password"));
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col justify-center h-[calc(100svh_-_16rem)]">
        <div className="flex justify-center">
          <div className="w-1/3 rounded-xl border border-slate-100 shadow-md">
            <div className="flex justify-start py-5 pl-6">
              <h2 className="font-semibold text-lg text-slate-700">
                Admin Login
              </h2>
            </div>
            <div className="bg-slate-300 h-px" />
            <div className="flex flex-col gap-5 px-5 pt-7 pb-6">
              <div className="flex flex-col gap-5">
                <GCInputTextWithLabel label="username" />
                <GCInputTextWithLabel label="password" type="password" />
              </div>
              <button className="bg-sky-600 text-white p-2 rounded-sm">
                <div className="flex gap-2 justify-center items-center">
                  { loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> }
                  <p>Login</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
