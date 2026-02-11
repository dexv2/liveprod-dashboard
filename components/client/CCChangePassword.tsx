"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import GCInputTextWithLabel from "@/components/global/GCInputTextWithLabel";
import { toast } from "react-toastify";
import { putChangePassword } from '@/utils/apis/put';
import { useRouter } from 'next/navigation';

export default function CCChangePassword() {
  const { data: session } = useSession();
  const [ loading, setLoading ] = useState(false);
  const id = (session?.user as any)?.id;
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const password1 = formData.get("new password") as string;
    const password2 = formData.get("confirm new password") as string;

    if (password1 !== password2) {
      toast.error("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      const result = await putChangePassword(id, password1);

      if (result?.error) {
        toast.error(result?.message ?? "Invalid password!");
        setLoading(false);
      } else {
        toast.success("Password changed successfully!");
        router.push("/login");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred while changing password.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex flex-col justify-center h-[calc(100svh_-_16rem)]">
        <div className="text-center text-sm md:text-lg text-white mb-5">First time logging in? Please change your password.</div>
        <div className="flex justify-center px-4">
          <div className="w-full max-w-md md:w-1/3 rounded-2xl border border-slate-300 shadow-md overflow-hidden">
            <div className="flex justify-start py-5 pl-6 bg-slate-800">
              <h2 className="font-semibold text-lg text-white">
                Admin Change Password
              </h2>
            </div>
            <div className="bg-slate-300 h-px" />
            <div className="flex flex-col gap-5 px-5 pt-7 pb-6 bg-black/15">
              <div className="flex flex-col gap-5">
                <GCInputTextWithLabel label="new password" type="password" />
                <GCInputTextWithLabel label="confirm new password" type="password" />
              </div>
              <button className="bg-slate-900 opacity-75 hover:opacity-100 text-white p-2 rounded-md">
                <div className="flex gap-2 justify-center items-center">
                  { loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> }
                  <p>Submit</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
