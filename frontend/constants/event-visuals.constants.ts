export interface EventVisual {
  category: string
  icon: string
  gradient: string
  venue: string
  date: string
  badge?: string
}

export const EVENT_VISUALS: Record<string, EventVisual> = {
  'e-1': {
    category: 'Concerts',
    icon: 'music_note',
    gradient: 'from-emerald-500/40 via-teal-600/20 to-surface-container-low',
    venue: 'Nhà hát Lớn Hà Nội',
    date: 'Sat, Oct 24 · 8:00 PM'
  },
  'e-2': {
    category: 'Concerts',
    icon: 'stadium',
    gradient: 'from-violet-500/50 via-purple-800/30 to-surface-container-low',
    venue: 'The Wall Indie House',
    date: 'Fri, Nov 06 · 9:00 PM',
    badge: 'Selling Fast · 62% Claimed'
  },
  'e-3': {
    category: 'Tech & AI',
    icon: 'neurology',
    gradient: 'from-cyan-500/40 via-sky-700/25 to-surface-container-low',
    venue: 'Hanoi Out-of-Office Center',
    date: 'Tue, Dec 01 · 9:00 AM',
    badge: '2-Day Pass'
  },
  'e-4': {
    category: 'Festivals',
    icon: 'festival',
    gradient: 'from-fuchsia-500/45 via-rose-700/25 to-surface-container-low',
    venue: 'Bill Graham Civic Auditorium',
    date: 'Fri, Oct 24 · 8:00 PM',
    badge: '3-Day Pass'
  },
  'e-5': {
    category: 'VIP Experience',
    icon: 'star',
    gradient: 'from-amber-400/40 via-orange-700/25 to-surface-container-low',
    venue: 'Backstage Lounge · Grand Hall',
    date: 'Sat, Oct 25 · 6:00 PM',
    badge: 'Meet & Greet'
  }
}

export const getEventVisual = (id: string): EventVisual => EVENT_VISUALS[id] ?? EVENT_VISUALS['e-1']

export const CATEGORIES = [
  { label: 'All Events', icon: 'explore' },
  { label: 'Concerts', icon: 'music_note' },
  { label: 'EDM & Nightlife', icon: 'nightlife' },
  { label: 'Festivals', icon: 'festival' },
  { label: 'Tech & AI', icon: 'neurology' },
  { label: 'Comedy', icon: 'theater_comedy' }
] as const
