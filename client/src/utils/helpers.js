export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const MODE_TITLES = {
  'oan-tu-ti': 'Oẳn Tù Tì',
  'majority-out': 'Nhiều Ra, Ít Bị',
  'minority-out': 'Ít Ra, Nhiều Bị'
}
