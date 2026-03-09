// src/collections/Contract.ts
import type { CollectionConfig, PayloadRequest } from 'payload'
import { triggerWorkflow } from '../plugins/workflowEngine'

type UserRole = 'admin' | 'reviewer' | 'approver'

export const Contract: CollectionConfig = {
  slug: 'contract',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'workflowPanel'],
  },

  access: {
    read: ({ req }) => {
      const user = req.user as { role?: UserRole } | null
      return user?.role ? ['admin', 'reviewer', 'approver'].includes(user.role) : false
    },
    create: ({ req }) => {
      const user = req.user as { role?: UserRole } | null
      return user?.role === 'admin'
    },
    update: ({ req }) => {
      const user = req.user as { role?: UserRole } | null
      return user?.role ? ['admin', 'reviewer', 'approver'].includes(user.role) : false
    },
    delete: ({ req }) => {
      const user = req.user as { role?: UserRole } | null
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
          return user?.role ? ['admin', 'approver'].includes(user.role) : false
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
          Field: '@/components/WorkflowPanel',
        },
      },
    },
  ],

  hooks: {
    afterChange: [
      async ({ doc, req }: { doc: any; req: PayloadRequest }) => {
        if (!doc || !req?.payload) {
          console.warn('[Contract Hook] No doc or payload instance')
          return
        }

        console.log('[Contract Hook] afterChange fired for doc:', doc.id, 'status:', doc.status)

        try {
          // Only trigger workflow for draft contracts
          if (doc.status === 'draft') {
            await triggerWorkflow(req.payload, 'contract', doc.id, doc)
            console.log('[Contract Hook] Workflow triggered for contract draft:', doc.id)
          } else {
            console.log('[Contract Hook] Contract status not draft, skipping workflow')
          }
        } catch (err) {
          console.error('[Contract Hook] Workflow trigger failed:', err)
        }
      },
    ],
  },
}
