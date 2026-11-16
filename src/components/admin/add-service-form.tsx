'use client'

import { AddItemForm } from './add-item-form'

interface ServiceCategory {
  id: number
  name: string
  icon: string | null
}

interface AddServiceFormProps {
  serviceCategories: ServiceCategory[]
  onServiceAdded: () => void
}

export function AddServiceForm({ serviceCategories, onServiceAdded }: AddServiceFormProps) {
  return <AddItemForm kind="service" categories={serviceCategories} onAdded={onServiceAdded} />
}
