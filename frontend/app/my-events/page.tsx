import OwnerEventsList from '@/containers/OwnerEvents/FeatureList/OwnerEventsList'

/**
 * Owner dashboard at /my-events rather than /events/new: `app/events/[id]` is a
 * dynamic segment, so a sibling static `app/events/new` would be unreachable and
 * the link would render the event page for an id called "new".
 */
export default function MyEventsPage() {
  return <OwnerEventsList />
}
