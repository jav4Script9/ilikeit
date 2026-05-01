const compressToWebp = (file, maxDim = 1920, quality = 0.85) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
  reader.onload = (ev) => {
    const img = new Image()
    img.onerror = () => reject(new Error('Браузер не смог открыть это фото — возможно, формат не поддерживается'))
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => {
        if (blob) return resolve(blob)
        canvas.toBlob(b2 => b2 ? resolve(b2) : reject(new Error('Кодирование изображения не удалось')), 'image/jpeg', quality)
      }, 'image/webp', quality)
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
})

export async function processImage(file, opts = {}) {
  const lower = (file.name || '').toLowerCase()
  const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || lower.endsWith('.heic') || lower.endsWith('.heif')
  let working = file
  if (isHeic) {
    const heic2any = (await import('heic2any')).default
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    const jpegBlob = Array.isArray(out) ? out[0] : out
    working = new File([jpegBlob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' })
  }
  return compressToWebp(working, opts.maxDim, opts.quality)
}
