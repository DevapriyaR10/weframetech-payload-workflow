import type { CollectionConfig } from 'payload'
import { triggerWorkflow } from '../plugins/workflowEngine'
import payload from 'payload'

export const Contract: CollectionConfig = {
  slug: 'contract',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'workflowPanel'],
  },

  // --- Type-safe access rules ---
  access: {
    read: ({ req }) => {
      const user = req.user as { role?: 'admin' | 'reviewer' | 'approver' } | null
      return user ? ['admin', 'reviewer', 'approver'].includes(user.role!) : false
    },
    create: ({ req }) => {
      const user = req.user as { role?: 'admin' | 'reviewer' | 'approver' } | null
      return user?.role === 'admin'
    },
    update: ({ req }) => {
      const user = req.user as { role?: 'admin' | 'reviewer' | 'approver' } | null
      return user ? ['admin', 'reviewer', 'approver'].includes(user.role!) : false
    },
    delete: ({ req }) => {
      const user = req.user as { role?: 'admin' | 'reviewer' | 'approver' } | null
      return user?.role === 'admin'
    },
  },

  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'amount', type: 'number', required: true },

    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Finalized', value: 'finalized' },
      ],
      defaultValue: 'draft',
      access: {
        update: ({ req }) => {
          const user = req.user as { role?: 'admin' | 'approver' } | null
          return user ? ['admin', 'approver'].includes(user.role!) : false
        },
      },
    },

    // Workflow Panel UI
    {
      name: 'workflowPanel',
      type: 'ui',
      label: 'Workflow Panel',
      admin: {
        components: {
          Field: '@/components/WorkflowPanel', // your workflow panel component
        },
      },
    },
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
      },
    ],
  },
}
