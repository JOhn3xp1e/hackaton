import { useCallback, useRef, useState } from 'react'
import { zodErrorsToObject } from '@/lib/schemas'

/**
 * useForm — tiny form state + Zod validation helper (no extra dependency).
 *
 *   const form = useForm({ schema: itemSchema, initialValues, onSubmit })
 *   <Input {...form.register('title')} />
 *   <Field error={form.errors.title}>…</Field>
 *   <form onSubmit={form.handleSubmit}>
 *
 * Server validation errors ({ details: { field: msg } }) can be pushed in with
 * form.setErrors(err.details).
 */
export function useForm({ schema, initialValues, onSubmit }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = useCallback(
    (name, nextValues) => {
      if (!schema) return
      const result = schema.safeParse(nextValues)
      const all = result.success ? {} : zodErrorsToObject(result.error)
      setErrors((prev) => ({ ...prev, [name]: all[name] }))
    },
    [schema],
  )

  const valuesRef = useRef(values)
  valuesRef.current = values

  const setValue = useCallback(
    (name, value) => {
      const next = { ...valuesRef.current, [name]: value }
      valuesRef.current = next
      setValues(next)
      if (touched[name]) validateField(name, next)
    },
    [touched, validateField],
  )

  /** Spread onto Input / Textarea / Select */
  const register = (name) => ({
    name,
    id: name,
    value: values[name] ?? '',
    onChange: (e) => setValue(name, e.target.type === 'checkbox' ? e.target.checked : e.target.value),
    onBlur: () => {
      setTouched((t) => ({ ...t, [name]: true }))
      validateField(name, values)
    },
    'aria-invalid': errors[name] ? true : undefined,
  })

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    let data = values
    if (schema) {
      const result = schema.safeParse(values)
      if (!result.success) {
        setErrors(zodErrorsToObject(result.error))
        setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])))
        return
      }
      data = result.data
    }
    setErrors({})
    setIsSubmitting(true)
    try {
      await onSubmit?.(data)
    } catch (err) {
      // Surface API validation errors on the matching fields
      if (err?.details && typeof err.details === 'object') setErrors(err.details)
      else setErrors({ _form: err?.message || 'Something went wrong' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const reset = (next = initialValues) => {
    setValues(next)
    setErrors({})
    setTouched({})
  }

  return { values, errors, touched, isSubmitting, register, setValue, setErrors, handleSubmit, reset }
}
