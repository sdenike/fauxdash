'use client'

import { useEffect, useState, useCallback } from 'react'
import { CategoryManager } from '@/components/admin/category-manager'
import { ServiceCategoryManager } from '@/components/admin/service-category-manager'
import { ContentManager } from '@/components/admin/content-manager'
import { AddBookmarkForm } from '@/components/admin/add-bookmark-form'
import { AddServiceForm } from '@/components/admin/add-service-form'
import { CSVImport } from '@/components/admin/csv-import'
import { AdminPage } from '@/components/admin/admin-page'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ContentPage() {
  const [categories, setCategories] = useState([])
  const [serviceCategories, setServiceCategories] = useState([])

  const fetchData = useCallback(async () => {
    try {
      const [categoriesRes, serviceCategoriesRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/service-categories'),
      ])
      const categoriesData = await categoriesRes.json()
      const serviceCategoriesData = await serviceCategoriesRes.json()
      setCategories(categoriesData)
      setServiceCategories(serviceCategoriesData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const [addKind, setAddKind] = useState<'bookmark' | 'service'>('bookmark')

  return (
    <AdminPage title="Content" description="Categories, bookmarks and services shown on the start page.">
      <Tabs defaultValue="content" className="w-full">
        <TabsList>
          <TabsTrigger value="content">Links</TabsTrigger>
          <TabsTrigger value="add">Add</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <ContentManager categories={categories} serviceCategories={serviceCategories} onContentChange={fetchData} />
        </TabsContent>

        <TabsContent value="add" className="space-y-6">
          <div role="radiogroup" aria-label="What to add" className="inline-flex rounded-md border border-border p-0.5">
            {(['bookmark', 'service'] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={addKind === kind}
                onClick={() => setAddKind(kind)}
                className={
                  addKind === kind
                    ? 'h-8 rounded-[5px] bg-accent px-3 text-sm font-medium text-foreground'
                    : 'h-8 rounded-[5px] px-3 text-sm text-muted-foreground hover:text-foreground'
                }
              >
                {kind === 'bookmark' ? 'Bookmark' : 'Service'}
              </button>
            ))}
          </div>
          {addKind === 'bookmark' ? (
            <AddBookmarkForm categories={categories} onBookmarkAdded={fetchData} />
          ) : (
            <AddServiceForm serviceCategories={serviceCategories} onServiceAdded={fetchData} />
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-10">
          <CategoryManager categories={categories} onCategoriesChange={fetchData} />
          <ServiceCategoryManager categories={serviceCategories} onCategoriesChange={fetchData} />
        </TabsContent>

        <TabsContent value="import">
          <CSVImport onImportComplete={fetchData} />
        </TabsContent>
      </Tabs>
    </AdminPage>
  )
}
