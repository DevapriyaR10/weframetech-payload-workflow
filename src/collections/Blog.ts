import type { CollectionConfig } from 'payload'
import payload from 'payload'
import { triggerWorkflow } from '../plugins/workflowEngine'

// Import WorkflowPanel React component directly
import WorkflowPanel from '../components/WorkflowPanel'

export const Blog: CollectionConfig = {
  slug: 'blog',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'status'] },

  access: {
    read: ({ req }) => req.user ? ['admin','reviewer','approver'].includes(req.user.role) : false,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user ? ['admin','reviewer','approver'].includes(req.user.role) : false,
    delete: ({ req }) => req.user?.role === 'admin',
  },

  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' }
      ],
      defaultValue: 'draft',
      access: {
        update: ({ req }) => req.user ? ['admin','approver'].includes(req.user.role) : false
      }
    },
    {
      name: 'content',
      type: 'richText',
      admin: {
        // Optional: Lexical editor if you want advanced editing
        // components: { Field: lexicalEditor },
      },
      required: true
    },
    {
      name: 'workflowPanel',
      type: 'ui',
      admin: {
        components: { Field: WorkflowPanel }, // Pass imported React component
      }
    }
  ],

  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (!doc) return console.warn('[Blog Hook] No document in afterChange hook');

        console.log('[Blog Hook] afterChange fired for doc:', doc.id);

        const payloadInstance = req?.payload || payload;

        try {
          // Pass collection slug explicitly
          await triggerWorkflow(doc, payloadInstance, req, 'blog');
        } catch (err) {
          console.error('[Blog Hook] Workflow trigger failed:', err);
        }
      }
    ]
  },
};
