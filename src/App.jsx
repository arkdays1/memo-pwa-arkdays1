import React, { useEffect, useMemo, useState } from 'react'
import { loadMemos, saveMemos } from './storage'

function newId() {
  // 现代浏览器支持 crypto.randomUUID()
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
    // 第一次打开给两条示例，方便你确认 UI 正常；你也可以删掉这段
    if (stored.length === 0) {
      const now = Date.now()
      const seed = [
        { id: newId(), title: '欢迎', content: '这是一个本地备忘录（无同步）。\n点击新建开始记录。', createdAt: now, updatedAt: now },
        { id: newId(), title: '小提示', content: '手机上访问开发地址后，可以“添加到主屏幕”。', createdAt: now - 60000, updatedAt: now - 60000 },
      ]
      saveMemos(seed)
      return seed
    }
    return stored
  })

  const [query, setQuery] = useState('')
  const [screen, setScreen] = useState('list') // 'list' | 'edit'
  const [activeId, setActiveId] = useState(null)

  // 持久化：任何变更都存到 localStorage
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
    <div className="app">
      <header className="topbar">
        <div className="brand">备忘录</div>
        {screen === 'list' ? (
          <button className="primary" onClick={goNew}>新建</button>
        ) : (
          <button className="ghost" onClick={backToList}>返回</button>
        )}
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
              <div className="emptySub">试试换个关键词，或点击右上角新建。</div>
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