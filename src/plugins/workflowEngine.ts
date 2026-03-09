type Condition = {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'lt'
  value: string | number
}

type Step = {
  name: string
  assignee: string
  conditions?: Condition[]
}

type Workflow = {
  id: string
  steps: Step[]
}

export const triggerWorkflow = async (
  doc: Record<string, unknown>,
  collection: string,
  req: any
) => {

  console.log("------ WORKFLOW ENGINE START ------")

  const workflows = await req.payload.find({
    collection: 'workflows',
    where: {
      collection: {
        equals: collection,
      },
    },
    depth: 2,
  })

  for (const workflow of workflows.docs as Workflow[]) {

    for (const step of workflow.steps) {

      let conditionsMet = true

      if (step.conditions?.length) {

        for (const cond of step.conditions) {

          const docValue = (doc as any)[cond.field]

          const val =
            typeof cond.value === 'string' && !isNaN(Number(cond.value))
              ? Number(cond.value)
              : cond.value

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

          if (!conditionsMet) break
        }
      }

      if (!conditionsMet) continue

      const logs = await req.payload.find({
        collection: 'workflowLogs',
        where: {
          workflow: { equals: workflow.id },
          stepName: { equals: step.name },
          documentId: { equals: String(doc.id) },
        },
      })

      if (logs.totalDocs > 0) continue

      console.log(`Triggering step: ${step.name}`)

      await req.payload.create({
        collection: 'workflowLogs',
        data: {
          workflow: workflow.id,
          documentId: String(doc.id),
          collection,
          stepName: step.name,
          user: step.assignee,
          action: 'pending',
        },
      })

      break
    }
  }

  console.log("------ WORKFLOW ENGINE END ------")
}

export const getWorkflowStatus = async (docId: string, req: any) => {
  return req.payload.find({
    collection: 'workflowLogs',
    where: {
      documentId: {
        equals: docId,
      },
    },
    sort: 'createdAt',
  })
}
