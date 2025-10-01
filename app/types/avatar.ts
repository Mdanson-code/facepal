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
    id: '1',
    name: 'Amara',
    description: 'A friendly and professional assistant',
    previewUrl: '/avatars/1/preview.mp4',
    idleUrl: '/avatars/1/idle.mp4',
    greetingUrl: '/avatars/1/greeting.mp4'
  },
  {
    id: '2',
    name: 'Jabari',
    description: 'An energetic and enthusiastic helper',
    previewUrl: '/avatars/2/preview.mp4',
    idleUrl: '/avatars/2/idle.mp4',
    greetingUrl: '/avatars/2/greeting.mp4'
  },
  {
    id: '3',
    name: 'Zuri',
    description: 'A calm and patient guide',
    previewUrl: '/avatars/3/preview.mp4',
    idleUrl: '/avatars/3/idle.mp4',
    greetingUrl: '/avatars/3/greeting.mp4'
  },
  {
    id: '4',
    name: 'Kwame',
    description: 'A wise and knowledgeable mentor',
    previewUrl: '/avatars/4/preview.mp4',
    idleUrl: '/avatars/4/idle.mp4',
    greetingUrl: '/avatars/4/greeting.mp4'
  },
  {
    id: '5',
    name: 'Nia',
    description: 'A creative and innovative thinker',
    previewUrl: '/avatars/5/preview.mp4',
    idleUrl: '/avatars/5/idle.mp4',
    greetingUrl: '/avatars/5/greeting.mp4'
  },
  {
    id: '6',
    name: 'Malik',
    description: 'A tech-savvy problem solver',
    previewUrl: '/avatars/6/preview.mp4',
    idleUrl: '/avatars/6/idle.mp4',
    greetingUrl: '/avatars/6/greeting.mp4'
  }
];