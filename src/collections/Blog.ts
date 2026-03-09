import type { CollectionConfig } from 'payload'
import payload from 'payload'
import { triggerWorkflow } from '../plugins/workflowEngine'
import BlogLexicalField from '../components/BlogLexicalField'

export const Blog: CollectionConfig = {
  slug: 'blog',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status'],
  },

  access: {
    read: ({ req }) => req.user ? ['admin','reviewer','approver'].includes(req.user.role) : false,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user ? ['admin','reviewer','approver'].includes(req.user.role) : false,
    delete: ({ req }) => req.user?.role === 'admin',
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      defaultValue: 'draft',
      access: {
        update: ({ req }) => req.user ? ['admin','approver'].includes(req.user.role) : false,
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        components: {
          Field: BlogLexicalField, // TS-safe wrapper
        },
      },
    },
    {
      name: 'workflowPanel',
      type: 'ui',
      admin: {
        components: {
          Field: '../../components/WorkflowPanel', // relative path for Render
        },
      },
    },
  ],

  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (!doc) return console.warn('[Blog Hook] No document in afterChange hook')

        const payloadInstance = req?.payload || payload

        try {
          await triggerWorkflow(doc, payloadInstance, req, 'blog')
        } catch (err) {
          console.error('[Blog Hook] Workflow trigger failed:', err)
        }
      },
    ],
  },
}
