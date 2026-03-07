import type { CollectionConfig } from 'payload'

export const Contract: CollectionConfig = {
  slug: 'contract',
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'amount', type: 'number', required: true },
    { name: 'status', type: 'select', options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Finalized', value: 'finalized' },
    ], defaultValue: 'draft' },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        const { triggerWorkflow } = await import('../plugins/workflowEngine')
        await triggerWorkflow(doc, 'contract', req)
      },
    ],
  },
}