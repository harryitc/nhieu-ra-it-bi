export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const MODE_TITLES = {
  'majority-out': 'Nhiều Ra, Ít Bị',
  'white-out': 'Trắng Ra, Đen Bị',
  'black-out': 'Đen Ra, Trắng Bị'
}
