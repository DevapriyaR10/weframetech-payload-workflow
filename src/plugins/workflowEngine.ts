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
  doc: Record<string, any>,
  collection: string,
  req: any
) => {

  console.log("------ WORKFLOW ENGINE START ------")
  console.log("Collection:", collection)
  console.log("Document ID:", doc?.id)
  console.log("Document Data:", doc)

  const workflows = await req.payload.find({
    collection: 'workflows',
    where: {
      collection: {
        equals: collection,
      },
    },
    depth: 2,
  })

  console.log("Workflows found:", workflows.totalDocs)
  console.log("Workflow docs:", workflows.docs)

  for (const workflow of workflows.docs as Workflow[]) {

    console.log("Checking workflow:", workflow.id)

    for (const step of workflow.steps) {

      console.log("Step:", step.name)
      console.log("Assignee:", step.assignee)

      let conditionsMet = true

      if (step.conditions?.length) {

        console.log("Conditions found:", step.conditions)

        for (const cond of step.conditions) {

          const docValue = doc[cond.field]

          const val =
            typeof cond.value === 'string' && !isNaN(Number(cond.value))
              ? Number(cond.value)
              : cond.value

          console.log("Checking condition")
          console.log("Field:", cond.field)
          console.log("Doc value:", docValue)
          console.log("Operator:", cond.operator)
          console.log("Expected value:", val)

          switch (cond.operator) {

            case 'eq':
              if (docValue != val) {
                conditionsMet = false
                console.log("Condition FAILED")
              } else {
                console.log("Condition PASSED")
              }
              break

            case 'neq':
              if (docValue == val) {
                conditionsMet = false
                console.log("Condition FAILED")
              } else {
                console.log("Condition PASSED")
              }
              break

            case 'gt':
              if (Number(docValue) <= Number(val)) {
                conditionsMet = false
                console.log("Condition FAILED")
              } else {
                console.log("Condition PASSED")
              }
              break

            case 'lt':
              if (Number(docValue) >= Number(val)) {
                conditionsMet = false
                console.log("Condition FAILED")
              } else {
                console.log("Condition PASSED")
              }
              break
          }
        }
      }

      if (!conditionsMet) {
        console.log("Skipping step because conditions not met")
        continue
      }

      console.log("Conditions satisfied, checking logs...")

      const logs = await req.payload.find({
        collection: 'workflowLogs',
        where: {
          workflow: { equals: workflow.id },
          stepName: { equals: step.name },
          documentId: { equals: doc.id },
        },
      })

      console.log("Existing logs for step:", logs.totalDocs)

      if (logs.totalDocs > 0) {
        console.log("Step already executed, skipping")
        continue
      }

      console.log("Triggering step:", step.name)

      console.log(
        `[Workflow Engine] Notify ${step.assignee} for step "${step.name}" on ${collection} ${doc.id}`
      )

      const createdLog = await req.payload.create({
        collection: 'workflowLogs',
        data: {
          workflow: workflow.id,
          documentId: doc.id,
          collection: collection,
          stepName: step.name,
          user: step.assignee,
          action: 'pending',
        },
      })

      console.log("Log created:", createdLog.id)

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