import type { CollectionConfig } from 'payload'

export const WorkflowLogs: CollectionConfig = {
  slug: 'workflowLogs',

  admin: {
    useAsTitle: 'action',
    defaultColumns: [
      'workflow',
      'documentId',
      'stepName',
      'user',
      'action',
      'createdAt',
    ],
  },

  access: {
    // Only system (workflow engine) should create logs
    create: () => false,

    // Logs should never be edited
    update: () => false,

    // Logs should never be deleted
    delete: () => false,

    // Only logged-in users can read logs
    read: ({ req }) => {
      if (!req.user) return false

      // Admin can see all logs
      if (req.user.role === 'admin') return true

      // Reviewer / Approver can only see their own logs
      return {
        user: {
          equals: req.user.id,
        },
      }
    },
  },

  fields: [
    {
      name: 'workflow',
      type: 'relationship',
      relationTo: 'workflows',
      required: true,
    },

    {
      name: 'documentId',
      type: 'text',
      required: true,
    },

    {
      name: 'collection',
      type: 'text',
      required: true,
    },

    {
      name: 'stepName',
      type: 'text',
      required: true,
    },

    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },

    {
      name: 'action',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Commented', value: 'commented' },
      ],
      required: true,
      defaultValue: 'pending',
    },

    {
      name: 'comment',
      type: 'textarea',
    },

    {
      name: 'createdAt',
      type: 'date',
      admin: {
        readOnly: true,
      },
      defaultValue: () => new Date(),
    },
  ],
}
