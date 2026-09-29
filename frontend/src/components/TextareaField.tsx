import type { ComponentProps } from 'react'

type Props = ComponentProps<'textarea'> & { id: string; label: string }

export default function TextareaField({ id, label, className = '', rows = 4, ...props }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-label-md text-on-surface">{label}</label>
      <textarea id={id} rows={rows} className={`w-full resize-y rounded-default border border-primary/20 bg-surface-container-low px-4 py-3 text-body-md text-on-surface focus:border-primary focus:outline-2 focus:outline-primary disabled:opacity-60 ${className}`} {...props} />
    </div>
  )
}
