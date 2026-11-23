import { useCallback, useState } from 'react'

/**
 * useMutation — wrap a create/update/delete call with loading + error state.
 *
 *   const { mutate, isLoading } = useMutation(ticketsService.create, {
 *     onSuccess: () => toast.success('Saved'),
 *   })
 *   await mutate(values)
 */
export function useMutation(mutationFn, { onSuccess, onError } = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const mutate = useCallback(
    async (...args) => {
      setIsLoading(true)
      setError(null)
      try {
        const result = await mutationFn(...args)
        await onSuccess?.(result, ...args)
        return result
      } catch (err) {
        setError(err)
        onError?.(err, ...args)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [mutationFn, onSuccess, onError],
  )

  return { mutate, isLoading, error, reset: () => setError(null) }
}
