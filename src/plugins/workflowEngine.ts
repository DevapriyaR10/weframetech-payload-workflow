// src/plugins/workflowEngine.ts
import type { BasePayload } from 'payload'

type Condition = {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'lt'
  value: string | number
}

type Step = {
  name: string
  assignee: { id: string } | string
  conditions?: Condition[]
}

type Workflow = {
  id: string
  steps: Step[]
}

/**
 * Trigger workflow steps for a document
 */
export const triggerWorkflow = async (
  payload: BasePayload,
  collectionSlug: string,
  docId: string,
  docData?: Record<string, any>
) => {
  if (!payload) return console.warn('[Workflow] Payload instance missing')

  const doc = docData || (await payload.findByID({ collection: collectionSlug as any, id: docId }))
  if (!doc) return console.warn('[Workflow] Document not found')

  console.log('[Workflow] Triggering workflow for document:', doc.id, 'in collection:', collectionSlug)

  // Fetch workflows for this collection
  const workflowsRes = await payload.find({
    collection: 'workflows' as any,
    where: { collection: { equals: collectionSlug } },
    depth: 2,
    overrideAccess: true,
  })

  const workflows = workflowsRes.docs as Workflow[]
  if (!workflows.length) return console.log('[Workflow] No workflows found for this collection')

  for (const workflow of workflows) {
    console.log('[Workflow] Evaluating workflow:', workflow.id)

    for (const step of workflow.steps || []) {
      console.log('[Workflow] Checking step:', step.name)
      let conditionsMet = true

      // Evaluate conditions if any
      if (step.conditions?.length) {
        for (const cond of step.conditions) {
          const docValue = doc[cond.field]
          const val = typeof cond.value === 'string' && !isNaN(Number(cond.value)) ? Number(cond.value) : cond.value

          // Log comparison
          console.log(`[Workflow Debug] Condition: doc[${cond.field}] = ${docValue} ${cond.operator} ${val}`)

          switch (cond.operator) {
            case 'eq':
              if (docValue != val) conditionsMet = false
              break
            case 'neq':
              if (docValue == val) conditionsMet = false
              break
            case 'gt':
              if (Number(docValue) <= Number(val)) conditionsMet = false
              break
            case 'lt':
              if (Number(docValue) >= Number(val)) conditionsMet = false
              break
          }

          if (!conditionsMet) {
            console.log(`[Workflow Debug] Step "${step.name}" condition failed, skipping`)
            break
          }
        }
      }

      if (!conditionsMet) continue

      // Skip if already logged
      const logsRes = await payload.find({
        collection: 'workflowLogs' as any,
        where: {
          workflow: { equals: workflow.id },
          stepName: { equals: step.name },
          documentId: { equals: String(doc.id) },
        },
        overrideAccess: true,
      })

      if (logsRes.totalDocs > 0) {
        console.log(`[Workflow] Step "${step.name}" already logged for document ${doc.id}, skipping.`)
        continue
      }

      // Create workflow log
      try {
        await payload.create({
          collection: 'workflowLogs' as any,
          data: {
            workflow: workflow.id,
            documentId: String(doc.id),
            collection: collectionSlug,
            stepName: step.name,
            user: typeof step.assignee === 'string' ? step.assignee : step.assignee.id,
            action: 'pending',
          },
          overrideAccess: true,
        })
        console.log(`[Workflow] Logged step "${step.name}" for document ${doc.id}`)
      } catch (err) {
        console.error('[Workflow] Failed to create workflow log:', err)
      }

      // Send notification email
      try {
        let userEmail = ''
        const userId = typeof step.assignee === 'string' ? step.assignee : step.assignee.id
        if (userId) {
          const userRes = await payload.findByID({ collection: 'users' as any, id: userId, overrideAccess: true })
          userEmail = userRes?.email || ''
        }

        if (userEmail) {
          await payload.sendEmail({
            to: userEmail,
            from: 'no-reply@yourdomain.com',
            subject: `Workflow Step Assigned: ${step.name}`,
            html: `<p>You have a pending workflow step "<b>${step.name}</b>" for document "${doc.title || doc.id}".</p>`,
          })
          console.log(`[Workflow] Notification sent to ${userEmail}`)
        } else {
          console.warn(`[Workflow] No email found for assignee of step "${step.name}"`)
        }
      } catch (err) {
        console.error('[Workflow] Failed to send email:', err)
      }

      // Stop after first matching step
      break
    }
  }
}
