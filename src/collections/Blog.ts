import type { CollectionConfig } from 'payload'

export const Blog: CollectionConfig = {
  slug: 'blog',
  admin: { useAsTitle: 'title' },

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
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
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