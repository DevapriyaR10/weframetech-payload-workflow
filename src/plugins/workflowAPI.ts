// src/plugins/workflowAPI.ts
import { Router } from 'express'
import type { Endpoint, CollectionSlug, PayloadRequest } from 'payload'
import { triggerWorkflow } from './workflowEngine'
import { getWorkflowStatus } from './workflowEngine' // assume you have this function

// Define request body type for triggering workflow
type TriggerWorkflowBody = {
  docId: string
  collection: CollectionSlug
}

// Trigger Workflow Endpoint
export const triggerWorkflowEndpoint: Endpoint = {
  path: '/workflows/trigger',
  method: 'post',
  handler: async (req) => {
    const body = await req.json?.() as Partial<TriggerWorkflowBody>
    const { docId, collection } = body || {}

    if (!docId || !collection) {
      return Response.json({ error: 'docId and collection required' }, { status: 400 })
    }

    const doc = await req.payload.findByID({
      collection,
      id: docId,
    })

    if (!doc) {
      return Response.json({ error: 'Document not found' }, { status: 404 })
    }

    await triggerWorkflow(doc as any, collection, req)

    return Response.json({ success: true })
  },
}

// Workflow Status Endpoint
export const workflowStatusEndpoint: Endpoint = {
  path: '/workflows/status/:docId',
  method: 'get',
  handler: async (req) => {
    const docId = req.routeParams?.docId

    if (!docId || typeof docId !== 'string') {
      return Response.json({ error: 'docId required' }, { status: 400 })
    }

    const status = await getWorkflowStatus(docId, req) 

    return Response.json(status)
  },
}

// Router for Express-style endpoints (optional if you want to use in Payload's endpoints array)
export const workflowRouter = Router()
workflowRouter.post('/trigger', triggerWorkflowEndpoint.handler)
workflowRouter.get('/status/:docId', workflowStatusEndpoint.handler)
