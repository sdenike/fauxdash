'use client'

import { AddItemForm } from './add-item-form'

interface Category {
  id: number
  name: string
  icon: string | null
}

interface AddBookmarkFormProps {
  categories: Category[]
  onBookmarkAdded: () => void
}

export function AddBookmarkForm({ categories, onBookmarkAdded }: AddBookmarkFormProps) {
  return <AddItemForm kind="bookmark" categories={categories} onAdded={onBookmarkAdded} />
}
