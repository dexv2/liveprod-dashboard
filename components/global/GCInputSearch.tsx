import { ChangeEventHandler } from "react";
import { CiSearch } from "react-icons/ci";

export default function GCInputSearch(
  { onChange }: { onChange: ChangeEventHandler<HTMLInputElement> | undefined }
) {
  return (
    <label htmlFor="search" className="relative text-gray-400 focus-within:text-gray-600 block w-full">
      <CiSearch size={24} className="pointer-events-none absolute top-1/2 transform -translate-y-1/2 left-3" />
      <input
        type="search"
        placeholder="Search volunteer name..."
        className="border border-slate-400 bg-slate-50 rounded-xl pl-10 pr-2 focus:outline-none w-full h-10"
        onChange={onChange}
      />
    </label>
  )
}
