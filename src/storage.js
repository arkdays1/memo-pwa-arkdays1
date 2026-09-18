const KEY = 'memo-pwa.memos.v1'

export function loadMemos() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data
  } catch {
    return []
  }
}

export function saveMemos(memos) {
  localStorage.setItem(KEY, JSON.stringify(memos))
}