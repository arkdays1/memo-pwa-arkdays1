import React, { useEffect, useMemo, useState } from 'react'
import { loadMemos, saveMemos } from './storage'

function newId() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return String(Date.now()) + '-' + Math.random().toString(16).slice(2)
}

function formatTime(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function normalizeTitle(title, content) {
  const t = (title || '').trim()
  if (t) return t
  const firstLine = (content || '').trim().split('\n')[0]?.trim()
  return firstLine ? firstLine.slice(0, 30) : '未命名备忘录'
}

function snippet(content) {
  const s = (content || '').replace(/\s+/g, ' ').trim()
  return s.length > 60 ? s.slice(0, 60) + '…' : s
}

export default function App() {
  const [memos, setMemos] = useState(() => {
    const stored = loadMemos()
    if (stored.length === 0) {
      const now = Date.now()
      const seed = [
        { id: newId(), title: '欢迎', content: '这是一个本地备忘录（无同步）。\n点击右下角 + 新建。', createdAt: now, updatedAt: now },
        { id: newId(), title: '小提示', content: '亮色玻璃风（磨砂效果取决于系统/浏览器支持）。', createdAt: now - 60000, updatedAt: now - 60000 },
      ]
      saveMemos(seed)
      return seed
    }
    return stored
  })

  const [query, setQuery] = useState('')
  const [screen, setScreen] = useState('list') // 'list' | 'edit'
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    saveMemos(memos)
  }, [memos])

  const sortedMemos = useMemo(() => {
    return [...memos].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [memos])

  const filteredMemos = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sortedMemos
    return sortedMemos.filter(m =>
      (m.title || '').toLowerCase().includes(q) ||
      (m.content || '').toLowerCase().includes(q)
    )
  }, [sortedMemos, query])

  const activeMemo = useMemo(() => {
    if (!activeId) return null
    return memos.find(m => m.id === activeId) || null
  }, [memos, activeId])

  function goNew() {
    const now = Date.now()
    const m = { id: newId(), title: '', content: '', createdAt: now, updatedAt: now }
    setMemos(prev => [m, ...prev])
    setActiveId(m.id)
    setScreen('edit')
  }

  function goEdit(id) {
    setActiveId(id)
    setScreen('edit')
  }

  function saveActive(patch) {
    setMemos(prev => prev.map(m => {
      if (m.id !== activeId) return m
      const next = { ...m, ...patch }
      next.title = normalizeTitle(next.title, next.content)
      next.updatedAt = Date.now()
      return next
    }))
  }

  function deleteActive() {
    if (!activeId) return
    const ok = confirm('确定删除这条备忘录吗？')
    if (!ok) return
    setMemos(prev => prev.filter(m => m.id !== activeId))
    setActiveId(null)
    setScreen('list')
  }

  function backToList() {
    setScreen('list')
    setActiveId(null)
  }

  return (
    <div className="app" data-screen={screen}>
      <header className="topbar">
        <div className="brand">备忘录</div>

        {/* 首页不再显示“新建”，只在编辑页显示返回 */}
        {screen === 'edit' ? (
          <button className="ghost" onClick={backToList}>返回</button>
        ) : null}
      </header>

      {screen === 'list' ? (
        <div className="panel">
          <div className="searchRow">
            <input
              className="input"
              placeholder="搜索标题或内容…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filteredMemos.length === 0 ? (
            <div className="empty">
              <div className="emptyTitle">没有匹配的备忘录</div>
              <div className="emptySub">试试换个关键词，或点击右下角 + 新建。</div>
            </div>
          ) : (
            <ul className="list">
              {filteredMemos.map(m => (
                <li key={m.id} className="item" onClick={() => goEdit(m.id)}>
                  <div className="itemTitle">{m.title}</div>
                  <div className="itemSub">
                    <span>{snippet(m.content)}</span>
                    <span className="dot">·</span>
                    <span>{formatTime(m.updatedAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <button className="fab" onClick={goNew} aria-label="新建备忘录">+</button>
        </div>
      ) : (
        <div className="panel">
          {!activeMemo ? (
            <div className="empty">
              <div className="emptyTitle">未找到备忘录</div>
              <div className="emptySub">可能已被删除。</div>
            </div>
          ) : (
            <div className="editor">
              <input
                className="input title"
                placeholder="标题（可空，会自动命名）"
                value={activeMemo.title}
                onChange={(e) => saveActive({ title: e.target.value })}
              />

              <textarea
                className="textarea"
                placeholder="开始记录…"
                value={activeMemo.content}
                onChange={(e) => saveActive({ content: e.target.value })}
              />

              <div className="editorBar">
                <div className="meta">更新于：{formatTime(activeMemo.updatedAt)}</div>
                <button className="danger" onClick={deleteActive}>删除</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}