import type { ComponentProps, ReactNode } from 'react'

type InputFieldProps = ComponentProps<'input'> & {
  id: string
  label: string
  icon?: ReactNode
}

export default function InputField({ id, label, icon, className = '', ...props }: InputFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label-md text-on-surface">{label}</label>
      <div className="relative">
        {icon && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-outline">{icon}</span>}
        <input
          id={id}
          className={`w-full rounded-default border border-primary/20 bg-surface-container-low py-3 pr-4 text-body-md text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-2 focus:outline-primary disabled:opacity-60 ${icon ? 'pl-12' : 'pl-4'} ${className}`}
          {...props}
        />
      </div>
    </div>
  )
}
