import type { ComponentProps } from 'react'

type SelectFieldProps = ComponentProps<'select'> & { id: string; label: string }

export default function SelectField({ id, label, className = '', children, ...props }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label-md text-on-surface">{label}</label>
      <select id={id} className={`w-full rounded-default border border-primary/20 bg-surface-container-low px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-2 focus:outline-primary disabled:opacity-60 ${className}`} {...props}>{children}</select>
    </div>
  )
}
