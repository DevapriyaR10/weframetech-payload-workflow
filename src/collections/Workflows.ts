import type { CollectionConfig } from 'payload'

export const Workflows: CollectionConfig = {
  slug: 'workflows',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'collection'],
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
      return user?.role === 'admin'
    },
    delete: ({ req }) => {
      const user = req.user as { role?: 'admin' | 'reviewer' | 'approver' } | null
      return user?.role === 'admin'
    },
  },

  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'collection',
      type: 'text',
      required: true,
      admin: { description: 'Collection slug this workflow applies to' },
    },
    {
      name: 'steps',
      type: 'array',
      minRows: 1,
      label: 'Workflow Steps',
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Step Name' },
        { name: 'assignee', type: 'relationship', relationTo: 'users', required: true },
        {
          name: 'role',
          type: 'select',
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'Reviewer', value: 'reviewer' },
            { label: 'Approver', value: 'approver' },
          ],
        },
        {
          name: 'stepType',
          type: 'select',
          required: true,
          options: [
            { label: 'Approval', value: 'approval' },
            { label: 'Review', value: 'review' },
            { label: 'Sign-Off', value: 'sign-off' },
            { label: 'Comment-Only', value: 'comment-only' },
          ],
          admin: { description: 'Type of workflow step' },
        },
        {
          name: 'conditions',
          type: 'array',
          label: 'Conditions',
          fields: [
            { name: 'field', type: 'text', required: true },
            {
              name: 'operator',
              type: 'select',
              options: [
                { label: '=', value: 'eq' },
                { label: '!=', value: 'neq' },
                { label: '>', value: 'gt' },
                { label: '<', value: 'lt' },
              ],
            },
            { name: 'value', type: 'text', required: true },
          ],
        },
        {
          name: 'slaHours',
          type: 'number',
          admin: { description: 'Optional SLA in hours for this step' },
        },
      ],
    },
  ],
}
