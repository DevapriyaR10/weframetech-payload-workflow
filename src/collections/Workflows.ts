// src/collections/Workflows.ts
import type { CollectionConfig, PayloadRequest } from 'payload'

type MyUser = {
  role?: 'admin' | 'reviewer' | 'approver'
}

export const Workflows: CollectionConfig = {
  slug: 'workflows',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'collection'],
  },

  // --- Type-safe access rules ---
  access: {
    read: ({ req }) => {
      const user = req.user as MyUser | null
      return user ? ['admin', 'reviewer', 'approver'].includes(user.role!) : false
    },
    create: ({ req }) => {
      const user = req.user as MyUser | null
      return user?.role === 'admin'
    },
    update: ({ req }) => {
      const user = req.user as MyUser | null
      return user?.role === 'admin'
    },
    delete: ({ req }) => {
      const user = req.user as MyUser | null
      return user?.role === 'admin'
    },
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'collection',
      type: 'text',
      required: true,
      admin: {
        description: 'Collection slug this workflow applies to',
      },
    },

    {
      name: 'steps',
      type: 'array',
      label: 'Workflow Steps',
      minRows: 1,
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Step Name',
        },
        {
          name: 'assignee',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          admin: {
            description: 'User assigned to this step',
          },
        },
        {
          name: 'role',
          type: 'select',
          required: true,
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
              required: true,
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
