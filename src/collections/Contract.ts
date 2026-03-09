import type { CollectionConfig } from 'payload'
import { triggerWorkflow } from '../plugins/workflowEngine'
import payload from 'payload'

export const Contract: CollectionConfig = {
  slug: 'contract',
  admin: { useAsTitle: 'title' },

  access: {
    read: ({ req }) => req.user ? ['admin','reviewer','approver'].includes(req.user.role) : false,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user ? ['admin','reviewer','approver'].includes(req.user.role) : false,
    delete: ({ req }) => req.user?.role === 'admin',
  },

  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'amount', type: 'number', required: true },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Finalized', value: 'finalized' }
      ],
      defaultValue: 'draft',
      access: {
        update: ({ req }) => req.user ? ['admin','approver'].includes(req.user.role) : false
      }
    },
    // Workflow Panel UI
    {
      name: 'workflowPanel',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/WorkflowPanel', // your workflow panel component
        }
      }
    }
  ],

  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (!doc) return console.warn('[Contract Hook] No document in afterChange hook')

        console.log('[Contract Hook] afterChange fired for doc:', doc.id)

        const payloadInstance = req?.payload || payload
        try {
          // Explicitly pass 'contract' as collection slug
          await triggerWorkflow(doc, payloadInstance, req, 'contract')
        } catch (err) {
          console.error('[Contract Hook] Workflow trigger failed:', err)
        }
      }
    ]
  },
}
