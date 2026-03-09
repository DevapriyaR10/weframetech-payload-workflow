import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,

  admin: {
    useAsTitle: 'email',
  },

  access: {
    
    create: ({ req }) => {
      return req.user?.role === 'admin'
    },

   
    delete: ({ req }) => {
      return req.user?.role === 'admin'
    },

    
    read: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return {
        id: {
          equals: req.user?.id,
        },
      }
    },

  
    update: ({ req }) => {
      if (req.user?.role === 'admin') return true
      return {
        id: {
          equals: req.user?.id,
        },
      }
    },
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
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
    },
  ],
}
