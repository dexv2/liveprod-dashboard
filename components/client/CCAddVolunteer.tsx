"use client";

import GCInputText from "@/components/global/GCInputText";
import GCSelect from "@/components/global/GCSelect";
import { category } from "@/utils/constants";
import { IoPersonAdd } from "react-icons/io5";
import { FormEvent, useState } from "react";
import { postAddVolunteer } from "@/utils/apis/post";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function CCAddVolunteer() {
  const router = useRouter();
  const [ firstName, setFirstName ] = useState<string>("");
  const [ lastName, setLastName ] = useState<string>("");
  const [ nickName, setNickName ] = useState<string>("");
  const [ segment, setSegment ] = useState<string>(category.SEGMENTS[0]);
  const [ status, setStatus ] = useState<string>(category.STATUS[0]);

  const addVolunteer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await postAddVolunteer({firstName, lastName, nickName, segment, status});
      toast.success('Volunteer added successfully!');
    } catch (error) {
      toast.error('Failed to add volunteer!');
    } finally {
      router.back();
    }
  }

  return (
    <form onSubmit={(e) => addVolunteer(e)}>
      <div className="px-5 pt-7 pb-20">
        <div className="flex flex-col gap-6">
          <div className="flex gap-3">
            <GCSelect onChange={(e) => setStatus(e.target.value)} label="status" value={status} options={category.STATUS} />
            <GCSelect onChange={(e) => setSegment(e.target.value)} label="segment" value={segment} options={category.SEGMENTS} />
          </div>
          <GCInputText onChange={(e) => setFirstName(e.target.value)} label="first name" value={firstName} required />
          <GCInputText onChange={(e) => setLastName(e.target.value)} label="last name" value={lastName} required />
          <GCInputText onChange={(e) => setNickName(e.target.value)} label="nickname" value={nickName} />
        </div>
      </div>
      <div className="absolute bottom-3 w-full px-5">
        <button type="submit" className="bg-sky-600 text-white p-2 rounded-md capitalize w-full">
          <div className="flex gap-2 justify-center">
            <div className="flex flex-col justify-center">
              <IoPersonAdd size={17} />
            </div>
            <div className="flex flex-col justify-end">
              add volunteer
            </div>
          </div>
        </button>
      </div>
    </form>
  )
}
