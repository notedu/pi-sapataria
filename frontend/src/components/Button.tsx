import type { ComponentProps } from 'react'

export default function Button({ className = '', type = 'button', ...props }: ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={`rounded-default bg-primary px-6 py-4 text-label-md text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60 ${className}`}
      {...props}
    />
  )
}
