import { Router } from 'express'
import payload from 'payload'
import { triggerWorkflow, getWorkflowStatus } from './workflowEngine'

export const workflowRouter = Router()

// POST /workflows/trigger
workflowRouter.post('/trigger', async (req, res) => {
  const { docId, collection } = req.body

  if (!docId || !collection)
    return res.status(400).json({ error: 'docId and collection required' })

  const doc = await payload.findByID({
    collection,
    id: docId,
  })

  if (!doc)
    return res.status(404).json({ error: 'Document not found' })

  await triggerWorkflow(doc, collection, req)

  return res.json({ success: true })
})

// GET /workflows/status/:docId
workflowRouter.get('/status/:docId', async (req, res) => {
  const docId = req.params.docId

  const status = await getWorkflowStatus(docId, req)

  res.json(status)
})