import type { ComponentProps } from 'react'

type ButtonProps = ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'danger' }

const variantes = {
  primary: 'bg-primary text-on-primary hover:bg-primary-container',
  secondary: 'border border-primary/30 bg-surface text-primary hover:bg-primary/5',
  danger: 'bg-error text-on-error hover:bg-error/90',
}

export default function Button({ className = '', type = 'button', variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-default px-6 py-4 text-label-md transition-colors ${variantes[variant]} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 ${className}`}
      {...props}
    />
  )
}
