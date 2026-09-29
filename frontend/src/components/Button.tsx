import type { ComponentProps } from 'react'

type ButtonProps = ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'danger' | 'dangerOutline'; size?: 'default' | 'compact' | 'icon' }

const variantes = {
  primary: 'bg-primary text-on-primary hover:bg-primary-container',
  secondary: 'border border-primary/30 bg-surface text-primary hover:bg-primary/5',
  dangerOutline: 'border border-error/30 bg-surface text-error hover:bg-error-container',
  danger: 'bg-error text-on-error hover:bg-error/90',
}

const tamanhos = { default: 'px-6 py-4', compact: 'px-4 py-2 min-h-11', icon: 'p-3 min-h-11 min-w-11' }

export default function Button({ className = '', type = 'button', variant = 'primary', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`rounded-default ${tamanhos[size]} text-label-md transition-colors ${variantes[variant]} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 ${className}`}
      {...props}
    />
  )
}
