import type { CollectionConfig } from 'payload'

export const Blog: CollectionConfig = {
  slug: 'blog',

  admin: {
    useAsTitle: 'title',
  },

  access: {
    read: ({ req }) => {
      if (!req.user) return false
      return ['admin', 'reviewer', 'approver'].includes(req.user.role)
    },

    create: ({ req }) => {
      if (!req.user) return false
      return req.user.role === 'admin'
    },

    update: ({ req }) => {
      if (!req.user) return false
      return ['admin', 'reviewer', 'approver'].includes(req.user.role)
    },

    delete: ({ req }) => {
      if (!req.user) return false
      return req.user.role === 'admin'
    },
  },

  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
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
                update: ({ req }) => {
                  if (!req.user) return false
                  return ['admin', 'approver'].includes(req.user.role)
                },
              },
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
            },
          ],
        },

        {
          label: 'Workflow',
          fields: [
            {
              name: 'workflowPanel',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/WorkflowPanel',
                },
              },
            },
          ],
        },
      ],
    },
  ],

  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        const { triggerWorkflow } = await import('../plugins/workflowEngine')
        await triggerWorkflow(doc, 'blog', req)
      },
    ],
  },
}
