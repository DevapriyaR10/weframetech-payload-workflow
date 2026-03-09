import type { Payload } from 'payload'

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

export const triggerWorkflow = async (
  doc: Record<string, any>,
  payload: Payload,
  req?: any,
  collectionSlug?: string
) => {
  if (!payload) return console.warn('[Workflow] Payload instance missing')

  const slug = collectionSlug || doc._collection || doc.collection
  if (!slug) return console.warn('[Workflow] Document collection not found')

  console.log('[Workflow] Triggering workflow for document:', doc.id, 'in collection:', slug)

  // 1️⃣ Fetch workflows for this collection
  const workflowsRes = await payload.find({
    collection: 'workflows',
    where: { collection: { equals: slug } },
    depth: 2,
    overrideAccess: true,
  })

  const workflows = workflowsRes.docs as Workflow[]
  if (!workflows.length) return console.log('[Workflow] No workflows found for this collection')

  for (const workflow of workflows) {
    for (const step of workflow.steps || []) {
      let conditionsMet = true

      // 2️⃣ Evaluate conditions if any
      if (step.conditions?.length) {
        for (const cond of step.conditions) {
          const docValue = doc[cond.field]
          const val = typeof cond.value === 'string' && !isNaN(Number(cond.value))
            ? Number(cond.value)
            : cond.value

          switch (cond.operator) {
            case 'eq': if (docValue != val) conditionsMet = false; break
            case 'neq': if (docValue == val) conditionsMet = false; break
            case 'gt': if (Number(docValue) <= Number(val)) conditionsMet = false; break
            case 'lt': if (Number(docValue) >= Number(val)) conditionsMet = false; break
          }
          if (!conditionsMet) break
        }
      }

      if (!conditionsMet) continue

      // 3️⃣ Skip step if already logged
      const logsRes = await payload.find({
        collection: 'workflowLogs',
        where: {
          workflow: { equals: workflow.id },
          stepName: { equals: step.name },
          documentId: { equals: String(doc.id) },
        },
        overrideAccess: true,
      })

      if (logsRes.totalDocs > 0) {
        console.log(`[Workflow] Step "${step.name}" already logged. Skipping.`)
        continue
      }

      // 4️⃣ Create workflow log
      try {
        await payload.create({
          collection: 'workflowLogs',
          data: {
            workflow: workflow.id,
            documentId: String(doc.id),
            collection: slug,
            stepName: step.name,
            user: typeof step.assignee === 'string' ? step.assignee : step.assignee.id,
            action: 'pending',
          },
          overrideAccess: true,
        })
        console.log(`[Workflow] Logged step: "${step.name}" for document ${doc.id}`)
      } catch (err) {
        console.error('[Workflow] Failed to create workflow log:', err)
      }

      // 5️⃣ Send notification email
      try {
        let userEmail = ''
        const userId = typeof step.assignee === 'string' ? step.assignee : step.assignee.id
        if (userId) {
          const userRes = await payload.findByID({ collection: 'users', id: userId, overrideAccess: true })
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
