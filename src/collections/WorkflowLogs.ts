import type { CollectionConfig } from 'payload'

export const WorkflowLogs: CollectionConfig = {
  slug: 'workflowLogs',

  admin: {
    useAsTitle: 'action',
    defaultColumns: ['workflow', 'documentId', 'stepName', 'user', 'action', 'createdAt'],
  },

  // --- Type-safe access rules ---
  access: {
    create: () => false, // Only workflow engine creates logs
    update: () => false, // Logs cannot be updated
    delete: () => false, // Logs cannot be deleted
    read: ({ req }) => {
      const user = req.user as { id: string; role?: 'admin' | 'reviewer' | 'approver' } | null
      if (!user) return false

      // Admin sees all logs
      if (user.role === 'admin') return true

      // Reviewer / Approver sees only their own logs
      return { user: { equals: user.id } }
    },
  },

  fields: [
    {
      name: 'workflow',
      type: 'relationship',
      relationTo: ['workflows'], // ✅ TS-safe as CollectionSlug[]
      required: true,
      admin: { label: 'Workflow Reference' },
    },

    {
      name: 'documentId',
      type: 'text',
      required: true,
      admin: { label: 'Document ID' },
    },

    {
      name: 'collection',
      type: 'text',
      required: true,
      admin: { label: 'Collection Slug' },
    },

    {
      name: 'stepName',
      type: 'text',
      required: true,
      admin: { label: 'Workflow Step Name' },
    },

    {
      name: 'user',
      type: 'relationship',
      relationTo: ['users'],
      required: true,
      admin: { label: 'Performed By' },
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
      admin: { label: 'Action Taken' },
    },

    {
      name: 'comment',
      type: 'textarea',
      admin: { label: 'Comment / Notes' },
    },

    {
      name: 'createdAt',
      type: 'date',
      admin: { readOnly: true, label: 'Created At' },
      defaultValue: () => new Date(),
    },
  ],
}
