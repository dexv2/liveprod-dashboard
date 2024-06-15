import { ChangeEventHandler } from "react";

interface SelectProps {
  label: string
  value: string
  options: string[]
  disabled?: boolean
  onChange?: ChangeEventHandler<HTMLSelectElement>
}

export default function GCSelect({ label, value, options, disabled, onChange }: SelectProps) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <label htmlFor="input" className="text-slate-500 pl-3 capitalize">{`${label}:`}</label>
      <select
        name={label}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className="bg-zinc-100 rounded-sm border border-b-slate-500 focus:border-b-sky-500 px-3 py-2 focus:outline-none capitalize border-r-8 border-r-transparent text-slate-700 disabled:opacity-100 disabled:appearance-none disabled:border-r-0"
      >
        {options.map((val, i) => (
          <option key={i} value={val} className="capitalize">{val}</option>
        ))}
      </select>
    </div>
  )
}