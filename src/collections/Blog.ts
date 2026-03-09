// src/collections/Blog.ts
import type { CollectionConfig } from 'payload'
import { triggerWorkflow } from '../plugins/workflowEngine'
import payload from 'payload'

export const Blog: CollectionConfig = {
  slug: 'blog',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'workflowPanel'],
  },

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

    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      access: {
        update: ({ req }) => {
          const user = req.user as { role?: 'admin' | 'approver' } | null
          return user ? ['admin', 'approver'].includes(user.role!) : false
        },
      },
    },

    {
      name: 'content',
      type: 'text',
      required: true,
      admin: {
        description: 'Main blog content',
      },
    },

    // Workflow Panel for UI
    {
      name: 'workflowPanel',
      type: 'ui',
      label: 'Workflow Panel',
      admin: {
        components: {
          Field: '@/components/WorkflowPanel', // your custom React component
        },
      },
    },
  ],

  hooks: {
  afterChange: [
    async ({ doc, req }) => {
      if (!doc) return

      const payloadInstance = req?.payload || payload

      try {
        if (doc.status === 'draft') {
          await triggerWorkflow(payloadInstance, req, 'blog', doc.id)
          console.log('[Blog Hook] Workflow triggered for blog draft:', doc.id)
        } else {
          console.log('[Blog Hook] Blog status not draft, skipping workflow')
        }
      } catch (err) {
        console.error('[Blog Hook] Workflow trigger failed:', err)
      }
    },
  ],
},
}
