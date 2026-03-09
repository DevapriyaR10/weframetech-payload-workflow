import type { CollectionConfig } from 'payload'
import { triggerWorkflow } from '../plugins/workflowEngine'
import payload from 'payload'

export const Blog: CollectionConfig = {
  slug: 'blog',
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

    // Make content a simple text field for admin usage
    {
      name: 'content',
      type: 'text',
      required: true,
      admin: {
        description: 'Main blog content',
      },
    },

    // Workflow Panel (UI component)
    {
      name: 'workflowPanel',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/WorkflowPanel',
        },
        description: 'Visual workflow panel for blog approval process',
      },
    },
  ],

  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (!doc) {
          console.warn('[Blog Hook] No document in afterChange hook')
          return
        }

        console.log('[Blog Hook] afterChange fired for doc:', doc.id)

        const payloadInstance = req?.payload || payload

        try {
          // Trigger workflow for this blog document
          await triggerWorkflow(doc, payloadInstance, req, 'blog')
        } catch (err) {
          console.error('[Blog Hook] Workflow trigger failed:', err)
        }
      },
    ],
  },
}
