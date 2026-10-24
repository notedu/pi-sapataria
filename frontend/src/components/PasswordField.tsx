import { useState } from 'react'
import type { ComponentProps } from 'react'
import InputField from './InputField'

type PasswordFieldProps = Omit<ComponentProps<typeof InputField>, 'type'>

export default function PasswordField(props: PasswordFieldProps) {
  const [visivel, setVisivel] = useState(false)

  return (
    <div className="relative">
      <InputField
        {...props}
        type={visivel ? 'text' : 'password'}
        className={`pr-12 ${props.className ?? ''}`}
      />
      <button
        type="button"
        aria-label={
          visivel
            ? `Ocultar ${props.label.toLowerCase()}`
            : `Mostrar ${props.label.toLowerCase()}`
        }
        aria-pressed={visivel}
        onClick={() => setVisivel((valor) => !valor)}
        disabled={props.disabled}
        className="absolute bottom-2 right-2 rounded p-2 text-on-surface-variant hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {visivel ? (
            <>
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </>
          ) : (
            <>
              <path d="m3 3 18 18" />
              <path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a15.7 15.7 0 0 1-3.1 3.9M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4.2-.9" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}
