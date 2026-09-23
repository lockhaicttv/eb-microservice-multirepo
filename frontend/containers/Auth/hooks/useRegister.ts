import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/api'
import { authQueryKey } from '@/api/query-keys.constants'
import useHandleErrors from '@/hooks/useHandleErrors'
import { useStore } from '@/store/useStore'

interface RegisterParams {
  name: string
  email: string
  password: string
}

const useRegister = () => {
  const setAuthentication = useStore((state) => state.setAuthentication)
  const queryClient = useQueryClient()
  const { handleAPIError } = useHandleErrors()
  return useMutation({
    mutationFn: ({ name, email, password }: RegisterParams) => authApi.register({ name, email, password }),
    onSuccess: (data) => {
      setAuthentication(data.accessToken, data.user)
      queryClient.invalidateQueries({ queryKey: authQueryKey.getMe() })
    },
    onError: (error) => {
      handleAPIError(error)
    }
  })
}

export default useRegister
