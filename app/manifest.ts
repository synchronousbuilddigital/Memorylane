import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Memory Lane',
    short_name: 'Memory Lane',
    description: 'Preserve your memories in cinematic 3D albums.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8f6f3',
    theme_color: '#1c1917',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
