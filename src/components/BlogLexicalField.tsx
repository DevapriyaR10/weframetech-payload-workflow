import React from 'react'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import type { Field } from 'payload/types'

const BlogLexicalField: Field = (props) => {
  return lexicalEditor(props)
}

export default BlogLexicalField
