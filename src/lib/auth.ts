import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, ApiError } from './api'
import type { User } from './types'

export const meKey = ['me'] as const

export function useMe() {
  return useQuery({
    queryKey: meKey,
    queryFn: async () => {
      try {
        return await api.get<User>('/auth/me')
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null
        throw err
      }
    },
    retry: false,
    staleTime: Infinity,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      api.post<User>('/auth/login', credentials),
    onSuccess: (user) => qc.setQueryData(meKey, user),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<void>('/auth/logout'),
    onSuccess: () => {
      // Drop the previous user's data but keep the "me" query, which the route guard observes.
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== meKey[0] })
      qc.setQueryData(meKey, null)
    },
  })
}
