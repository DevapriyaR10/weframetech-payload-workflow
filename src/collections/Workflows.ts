import type { CollectionConfig } from 'payload'

export const Workflows: CollectionConfig = {
  slug: 'workflows',
  admin: { useAsTitle: 'name', defaultColumns: ['name','collection'] },
  access: {
    read: ({ req }) => req.user ? ['admin','reviewer','approver'].includes(req.user.role) : false,
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req }) => req.user?.role === 'admin',
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'collection', type: 'text', required: true, admin: { description: 'Collection slug this workflow applies to' } },
    { name: 'steps', type: 'array', minRows: 1, fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'assignee', type: 'relationship', relationTo: 'users', required: true },
        { name: 'role', type: 'select', options: [
            { label: 'Admin', value: 'admin' },
            { label: 'Reviewer', value: 'reviewer' },
            { label: 'Approver', value: 'approver' }
          ]
        },
        { name: 'stepType', type: 'select', options: [
            { label: 'Approval', value: 'approval' },
            { label: 'Review', value: 'review' },
            { label: 'Sign-Off', value: 'sign-off' },
            { label: 'Comment-Only', value: 'comment-only' }
          ], required: true
        },
        { name: 'conditions', type: 'array', fields: [
            { name: 'field', type: 'text', required: true },
            { name: 'operator', type: 'select', options: [
                { label: '=', value: 'eq' },
                { label: '!=', value: 'neq' },
                { label: '>', value: 'gt' },
                { label: '<', value: 'lt' }
              ]
            },
            { name: 'value', type: 'text', required: true }
          ]
        },
        { name: 'slaHours', type: 'number', admin: { description: 'Optional SLA in hours' } }
      ]
    }
  ]
}
