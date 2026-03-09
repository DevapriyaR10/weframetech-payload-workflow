import React from 'react'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

// Payload v3 custom field type can be React.FC<any>
const BlogLexicalField: React.FC<any> = (props) => lexicalEditor(props)

export default BlogLexicalField
