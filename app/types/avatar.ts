// Types for avatar selection and video states
export interface Avatar {
  id: string;
  name: string;
  description: string;
  previewUrl: string;    // URL to preview image/video
  idleUrl: string;       // URL to idle animation video
  greetingUrl: string;   // URL to greeting video
}

// List of available avatars
export const avatars: Avatar[] = [
  {
    id: 'sarah',
    name: 'Sarah',
    description: 'Friendly and professional',
    previewUrl: '/avatars/sarah/preview.jpg',
    idleUrl: '/avatars/sarah/idle.mp4',
    greetingUrl: '/avatars/sarah/greeting.mp4'
  },
  {
    id: 'michael',
    name: 'Michael',
    description: 'Confident and direct',
    previewUrl: '/avatars/michael/preview.jpg',
    idleUrl: '/avatars/michael/idle.mp4',
    greetingUrl: '/avatars/michael/greeting.mp4'
  },
  {
    id: 'james',
    name: 'James',
    description: 'Warm and empathetic',
    previewUrl: '/avatars/james/preview.jpg',
    idleUrl: '/avatars/james/idle.mp4',
    greetingUrl: '/avatars/james/greeting.mp4'
  },
  {
    id: 'emily',
    name: 'Emily',
    description: 'Technical expert',
    previewUrl: '/avatars/emily/preview.jpg',
    idleUrl: '/avatars/emily/idle.mp4',
    greetingUrl: '/avatars/emily/greeting.mp4'
  },
  {
    id: 'lisa',
    name: 'Lisa',
    description: 'Creative and dynamic',
    previewUrl: '/avatars/lisa/preview.jpg',
    idleUrl: '/avatars/lisa/idle.mp4',
    greetingUrl: '/avatars/lisa/greeting.mp4'
  },
  {
    id: 'david',
    name: 'David',
    description: 'Analytical and precise',
    previewUrl: '/avatars/david/preview.jpg',
    idleUrl: '/avatars/david/idle.mp4',
    greetingUrl: '/avatars/david/greeting.mp4'
  }
];