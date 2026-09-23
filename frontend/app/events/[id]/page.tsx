import EventDetail from '@/containers/EventDetail/FeatureDetail/EventDetail'

export default async function EventDetailPage({ params }: PageProps<'/events/[id]'>) {
  const { id } = await params
  return <EventDetail eventId={id} />
}
