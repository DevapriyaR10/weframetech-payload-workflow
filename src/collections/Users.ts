import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,

  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role'],
  },

  // --- Type-safe access rules ---
  access: {
    create: ({ req }) => {
      const user = req.user as { role?: 'admin' | 'reviewer' | 'approver' } | null
      return user?.role === 'admin'
    },
    delete: ({ req }) => {
      const user = req.user as { role?: 'admin' | 'reviewer' | 'approver' } | null
      return user?.role === 'admin'
    },
    read: ({ req }) => {
      const user = req.user as { id: string; role?: 'admin' | 'reviewer' | 'approver' } | null
      if (user?.role === 'admin') return true
      return user ? { id: { equals: user.id } } : false
    },
    update: ({ req }) => {
      const user = req.user as { id: string; role?: 'admin' | 'reviewer' | 'approver' } | null
      if (user?.role === 'admin') return true
      return user ? { id: { equals: user.id } } : false
    },
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Full name of the user',
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
      defaultValue: 'reviewer',
      admin: {
        description: 'Role determines access permissions',
      },
    },
  ],
}
