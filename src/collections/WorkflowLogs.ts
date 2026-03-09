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
    create: () => false,
    update: () => false,
    delete: () => false,
    read: ({ req }) => {
      const user = req.user as { id: string; role?: 'admin' | 'reviewer' | 'approver' } | null
      if (!user) return false

      if (user.role === 'admin') return true

      return {
        user: { equals: user.id },
      }
    },
  },

  fields: [
    {
      name: 'workflow',
      type: 'relationship',
      relationTo: 'workflows' as const, // ✅ TS-safe
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
      relationTo: 'users' as const, // ✅ TS-safe
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
      admin: { readOnly: true },
      defaultValue: () => new Date(),
    },
  ],
}
