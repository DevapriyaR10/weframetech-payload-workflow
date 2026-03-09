import type { CollectionConfig } from 'payload'

export const Contract: CollectionConfig = {
  slug: 'contract',

  admin: {
    useAsTitle: 'title',
  },

  access: {
    read: ({ req }) => {
      // All roles can read contracts
      if (!req.user) return false
      return ['admin', 'reviewer', 'approver'].includes(req.user.role)
    },

    create: ({ req }) => {
      // Only admin can create contracts
      return req.user?.role === 'admin'
    },

    update: ({ req }) => {
  const role = req.user?.role
  if (!role) return false

  return ['admin', 'reviewer', 'approver'].includes(role)
},

    delete: ({ req }) => {
      // Only admin can delete
      return req.user?.role === 'admin'
    },
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },

    {
      name: 'amount',
      type: 'number',
      required: true,
    },

    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Finalized', value: 'finalized' },
      ],
      defaultValue: 'draft',

      // Only admin + approver can change status
      access: {
  update: ({ req }) => {
    if (!req.user) return false
    return ['admin', 'approver'].includes(req.user.role)
  }
},
    },
  ],

  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        const { triggerWorkflow } = await import('../plugins/workflowEngine')
        await triggerWorkflow(doc, 'contract', req)
      },
    ],
  },
}
