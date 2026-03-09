import type { CollectionConfig } from 'payload'

export const Blog: CollectionConfig = {
  slug: 'blog',

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status'],
  },

  access: {
    read: ({ req }) =>
      req.user ? ['admin', 'reviewer', 'approver'].includes(req.user.role) : false,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) =>
      req.user ? ['admin', 'reviewer', 'approver'].includes(req.user.role) : false,
    delete: ({ req }) => req.user?.role === 'admin',
  },

  fields: [
    {
      type: 'tabs',
      tabs: [
        // ---------------- Content Tab ----------------
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
                update: ({ req }) =>
                  req.user ? ['admin', 'approver'].includes(req.user.role) : false,
              },
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
              admin: {}, // safe TS config
            },
          ],
        },

        // ---------------- Workflow Tab ----------------
        {
          label: 'Workflow',
          fields: [
            {
              name: 'workflowPanel',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/components/WorkflowPanel', // ensure default export
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
        try {
          const { triggerWorkflow } = await import('../plugins/workflowEngine')
          await triggerWorkflow(doc, 'blog', req)
        } catch (err) {
          console.error('Workflow trigger failed:', err)
        }
      },
    ],
  },
}
