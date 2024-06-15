import { ChangeEventHandler } from "react"

interface InputText {
  label: string
  value: string
  disabled?: boolean
  required?: boolean
  onChange?: ChangeEventHandler<HTMLInputElement>
}

export default function GCInputText({ label, value, disabled, required, onChange }: InputText) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <input
        type="text"
        name={label}
        value={value}
        disabled={disabled}
        onChange={onChange}
        autoComplete="off"
        required={required}
        placeholder={`${label}${required ? " (required)" : ""}`}
        onBlur={(e) => {
          if (required && !value.length && e.target.classList.contains("border-b-slate-500")) {
            e.target.classList.add("border-b-red-500")
            e.target.classList.remove("border-b-slate-500")
          } else if (required && value.length && e.target.classList.contains("border-b-red-500")) {
            e.target.classList.add("border-b-slate-500")
            e.target.classList.remove("border-b-red-500")
          }
        }}
        className="bg-zinc-100 rounded-sm border border-b-slate-500 focus:border-b-sky-500 px-3 py-2 focus:outline-none text-slate-700"
      />
    </div>
  )
}
