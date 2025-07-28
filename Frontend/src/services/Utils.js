//
export function copyJoinCode($q, text) {
  if (!text) return
  navigator.clipboard
    .writeText(text)
    .then(() => {
      $q.notify({
        type: 'positive',
        message: 'Code copié dans le presse-papiers',
        position: 'top',
      })
    })
    .catch(() => {
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la copie du code',
        position: 'top',
      })
    })
}
