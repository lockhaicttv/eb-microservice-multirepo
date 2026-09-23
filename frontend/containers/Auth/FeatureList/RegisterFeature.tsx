'use client'

import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Icon from '@/components/Icon'
import useRegister from '@/containers/Auth/hooks/useRegister'
import { useStore } from '@/store/useStore'

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(4, 'Password must be at least 4 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })

type RegisterFormValues = z.infer<typeof registerSchema>

const RegisterFeature = () => {
  const router = useRouter()
  const setAuthentication = useStore((state) => state.setAuthentication)
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  })

  useEffect(() => {
    const accessToken = useStore.getState().accessToken
    if (accessToken) router.replace('/')
  }, [router])

  const onSubmit: SubmitHandler<RegisterFormValues> = async ({ name, email, password }) => {
    registerMutation.mutate(
      { name, email, password },
      {
        onSuccess: (data) => {
          setAuthentication(data.accessToken, data.user)
          router.replace('/')
        }
      }
    )
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
              <h1 className='text-headline-lg font-display font-bold text-on-surface'>Create your account</h1>
              <p className='text-body-md text-on-surface-variant'>Join Pulse Events for tickets and realtime updates</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-label-md text-on-surface-variant' htmlFor='name'>
                  Full Name
                </label>
                <input
                  id='name'
                  type='text'
                  placeholder='Alex Morgan'
                  {...register('name')}
                  className='px-3.5 py-2.5 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all'
                />
                {errors.name && <span className='text-body-sm text-error'>{errors.name.message}</span>}
              </div>

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

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
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
                <div className='flex flex-col gap-1.5'>
                  <label className='text-label-md text-on-surface-variant' htmlFor='confirmPassword'>
                    Confirm
                  </label>
                  <input
                    id='confirmPassword'
                    type='password'
                    placeholder='••••••••'
                    {...register('confirmPassword')}
                    className='px-3.5 py-2.5 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface placeholder:text-outline focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all'
                  />
                  {errors.confirmPassword && (
                    <span className='text-body-sm text-error'>{errors.confirmPassword.message}</span>
                  )}
                </div>
              </div>

              {registerMutation.error && (
                <p className='text-body-sm text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2'>
                  {(registerMutation.error as Error).message}
                </p>
              )}

              <button
                type='submit'
                disabled={registerMutation.isPending}
                className='mt-2 w-full min-h-[48px] py-3.5 px-6 rounded-full bg-primary-container text-on-primary-container text-label-lg font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all shadow-[0_8px_24px_rgba(160,120,255,0.45)] disabled:opacity-40 disabled:cursor-not-allowed'
              >
                {registerMutation.isPending ? (
                  <>
                    <Icon name='sync' className='text-[20px] animate-spin' />
                    Creating account…
                  </>
                ) : (
                  <>Create Account</>
                )}
              </button>
            </form>

            <p className='mt-6 text-center text-body-md text-on-surface-variant'>
              Already have an account?{' '}
              <Link href='/login' className='text-secondary hover:underline font-semibold'>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default RegisterFeature
