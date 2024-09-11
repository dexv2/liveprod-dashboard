import { ChangeEventHandler } from "react";

interface SelectProps {
  label: string
  value?: string
  options: string[]
  disabled?: boolean
  uppercase?: boolean
  onChange?: ChangeEventHandler<HTMLSelectElement>
}

export default function GCSelect({ label, value, options, disabled, uppercase = false, onChange }: SelectProps) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <label htmlFor="input" className="text-slate-500 pl-3 capitalize">{`${label}:`}</label>
      <select
        name={label}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className={`${uppercase ? "uppercase" : "capitalize"} bg-zinc-100 rounded-sm border border-b-slate-400 focus:border-b-sky-500 px-3 py-2 focus:outline-none border-r-8 border-r-transparent text-slate-700 disabled:opacity-100 disabled:appearance-none disabled:border-r-0`}
      >
        {!value && <option className="text-center" key={0} value={undefined}>{disabled ? "" : "- Select to add -"}</option>}
        {options.map((val, i) => (
          <option className="" key={i+1} value={val}>{val}</option>
        ))}
      </select>
    </div>
  )
}
