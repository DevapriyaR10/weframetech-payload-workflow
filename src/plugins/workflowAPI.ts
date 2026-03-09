// src/plugins/workflowAPI.ts
import type { Endpoint, PayloadRequest } from 'payload'
import { getWorkflowStatus } from './workflowEngine'

export const workflowStatusEndpoint: Endpoint = {
  path: '/workflows/status/:docId',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    // 1️⃣ Validate docId
    const docIdRaw = req.routeParams?.docId
    if (!docIdRaw || typeof docIdRaw !== 'string') {
      return new Response(JSON.stringify({ error: 'docId required in URL' }), { status: 400 })
    }
    const docId: string = docIdRaw

    // 2️⃣ Validate collection query param
    const collectionRaw = req.query?.collection
    if (!collectionRaw || typeof collectionRaw !== 'string') {
      return new Response(JSON.stringify({ error: 'collection query parameter required' }), { status: 400 })
    }
    const collection: string = collectionRaw

    try {
      // 3️⃣ Fetch workflows for the collection
      const workflowsRes = await req.payload.find({
        collection: 'workflows',
        where: { collection: { equals: collection } },
        depth: 2,
        overrideAccess: true,
      })

      const workflows = workflowsRes.docs
      if (!workflows.length) {
        return new Response(JSON.stringify({ status: [] }), { status: 200 })
      }

      // 4️⃣ Fetch status for all workflows
      const status = await Promise.all(
        workflows.map(async (workflow) => {
          const stepsStatus = await getWorkflowStatus(req.payload, workflow.id, docId)
          return {
            workflowId: workflow.id,
            workflowName: workflow.name,
            steps: stepsStatus || [],
          }
        })
      )

      // 5️⃣ Return workflow status
      return new Response(JSON.stringify(status), { status: 200 })
    } catch (err) {
      console.error('[Workflow] Failed to fetch workflow status:', err)
      return new Response(JSON.stringify({ error: 'Failed to fetch workflow status' }), { status: 500 })
    }
  },
}
