'use client'

import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/components/Icon'
import useLogin from '@/containers/Auth/hooks/useLogin'
import { useStore } from '@/store/useStore'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters')
})

type LoginFormValues = z.infer<typeof loginSchema>

const LoginFeature = () => {
  const router = useRouter()
  const setAuthentication = useStore((state) => state.setAuthentication)
  const loginMutation = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  })

  useEffect(() => {
    const accessToken = useStore.getState().accessToken
    if (accessToken) router.replace('/')
  }, [router])

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        setAuthentication(data.accessToken, data.user)
        router.replace('/')
      }
    })
  }

  return (
    <main className='flex-1 flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-md'>
        <div className='relative rounded-2xl bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-2xl'>
          <div className='absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-secondary'></div>
          <div className='p-8'>
            <div className='flex flex-col items-center gap-2 mb-8'>
              <div className='w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary shadow-[0_0_24px_rgba(139,92,246,0.25)]'>
                <Icon name='graphic_eq' className='text-[28px]' />
              </div>
              <h1 className='text-headline-lg font-display font-bold text-on-surface'>Welcome back</h1>
              <p className='text-body-md text-on-surface-variant'>Sign in to access your tickets and wallet</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-label-md text-on-surface-variant' htmlFor='email'>
                  Email
                </label>
                <input
                  id='email'
                  type='email'
                  placeholder='you@example.com'
                  {...register('email')}
                  className='px-3.5 py-2.5 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all'
                />
                {errors.email && <span className='text-body-sm text-error'>{errors.email.message}</span>}
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-label-md text-on-surface-variant' htmlFor='password'>
                  Password
                </label>
                <input
                  id='password'
                  type='password'
                  placeholder='••••••••'
                  {...register('password')}
                  className='px-3.5 py-2.5 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all'
                />
                {errors.password && <span className='text-body-sm text-error'>{errors.password.message}</span>}
              </div>

              {loginMutation.error && (
                <p className='text-body-sm text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2'>
                  {(loginMutation.error as Error).message}
                </p>
              )}

              <button
                type='submit'
                disabled={loginMutation.isPending}
                className='mt-2 w-full min-h-[48px] py-3.5 px-6 rounded-full bg-primary-container text-on-primary-container text-label-lg font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-[0_8px_24px_rgba(160,120,255,0.45)] disabled:opacity-40 disabled:cursor-not-allowed'
              >
                {loginMutation.isPending ? (
                  <>
                    <Icon name='sync' className='text-[20px] animate-spin' />
                    Signing in…
                  </>
                ) : (
                  <>Sign In</>
                )}
              </button>
            </form>

            <p className='mt-6 text-center text-body-md text-on-surface-variant'>
              New to Pulse Events?{' '}
              <Link href='/register' className='text-secondary hover:underline font-semibold'>
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default LoginFeature
