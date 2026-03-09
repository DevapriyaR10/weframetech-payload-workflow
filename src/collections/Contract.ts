// src/collections/Contract.ts
import type { CollectionConfig, PayloadRequest } from 'payload'
import { triggerWorkflow } from '../plugins/workflowEngine'

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
          Field: '@/components/WorkflowPanel',
        },
      },
    },
  ],

  hooks: {
    afterChange: [
      async ({ doc, req }: { doc: any; req: PayloadRequest }) => {
        if (!doc || !req?.payload) {
          return console.warn('[Contract Hook] No document or payload instance')
        }

        console.log('[Contract Hook] afterChange fired for doc:', doc.id)

        try {
          // TS-safe call: payload, collectionSlug, docId, optional doc
          await triggerWorkflow(req.payload, 'contract', doc.id, doc)
          console.log('[Contract Hook] Workflow triggered for contract draft:', doc.id)
        } catch (err) {
          console.error('[Contract Hook] Workflow trigger failed:', err)
        }
      },
    ],
  },
}
