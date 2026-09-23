const Footer = () => {
  return (
    <footer className='border-t border-outline-variant/30 bg-surface'>
      <div className='max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4'>
        <div className='flex items-center gap-2'>
          <div className='w-7 h-7 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary'>
            <span className='material-symbols-outlined text-[18px]'>graphic_eq</span>
          </div>
          <span className='text-label-lg text-on-surface font-display font-bold tracking-tight'>Pulse Events</span>
        </div>
        <p className='text-body-sm text-on-surface-variant'>
          Demo microservice ticketing platform poised on Kafka + gRPC.
        </p>
        <div className='text-body-sm text-outline'>© {new Date().getFullYear()} Pulse Events</div>
      </div>
    </footer>
  )
}

export default Footer
