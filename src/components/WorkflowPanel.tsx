'use client'

import React, { useEffect, useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

type Log = {
  id: string
  stepName: string
  action: string
  createdAt: string
  user?: {
    id: string
    email?: string
  }
  comment?: string
}

const WorkflowPanel: React.FC = () => {
  const { id } = useDocumentInfo()
  const [logs, setLogs] = useState<Log[]>([])
  const [comment, setComment] = useState('')

  const fetchLogs = async () => {
    if (!id) return

    const res = await fetch(
      `/api/workflowLogs?where[documentId][equals]=${id}&depth=1`
    )

    const data = await res.json()
    setLogs(data.docs)
  }

  useEffect(() => {
    fetchLogs()
  }, [id])

  const approve = async (logId: string) => {
    await fetch('/api/workflow/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId }),
    })

    fetchLogs()
  }

  const reject = async (logId: string) => {
    await fetch('/api/workflow/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId }),
    })

    fetchLogs()
  }

  const addComment = async (logId: string) => {
    await fetch('/api/workflow/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logId,
        comment,
      }),
    })

    setComment('')
    fetchLogs()
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>Workflow Progress</h3>

      {logs.length === 0 && <p>No workflow actions yet</p>}

      {logs.map((log) => (
        <div
          key={log.id}
          style={{
            marginBottom: 16,
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 6,
          }}
        >
          <strong>{log.stepName}</strong> — {log.action}

          <div>
            {log.user?.email && <span>Assigned: {log.user.email}</span>}
          </div>

          <div>
            {new Date(log.createdAt).toLocaleString()}
          </div>

          {log.comment && (
            <div style={{ marginTop: 6 }}>
              <em>Comment: {log.comment}</em>
            </div>
          )}

          {log.action === 'pending' && (
            <div style={{ marginTop: 10 }}>
              <button onClick={() => approve(log.id)}>Approve</button>

              <button
                onClick={() => reject(log.id)}
                style={{ marginLeft: 8 }}
              >
                Reject
              </button>

              <div style={{ marginTop: 8 }}>
                <input
                  value={comment}
                  placeholder="Add comment"
                  onChange={(e) => setComment(e.target.value)}
                />

                <button
                  onClick={() => addComment(log.id)}
                  style={{ marginLeft: 6 }}
                >
                  Comment
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default WorkflowPanel
