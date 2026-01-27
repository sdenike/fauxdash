'use client'

import { useEffect, useState } from 'react'
import { CategoryManager } from '@/components/admin/category-manager'
import { ServiceCategoryManager } from '@/components/admin/service-category-manager'
import { ContentManager } from '@/components/admin/content-manager'
import { AddBookmarkForm } from '@/components/admin/add-bookmark-form'
import { AddServiceForm } from '@/components/admin/add-service-form'
import { CSVImport } from '@/components/admin/csv-import'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function BookmarksPage() {
  const [categories, setCategories] = useState([])
  const [serviceCategories, setServiceCategories] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
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
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent mb-2">
          Content Management
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your categories, bookmarks, and services
        </p>
      </div>

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="add-bookmark">Add Bookmark</TabsTrigger>
          <TabsTrigger value="add-service">Add Service</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <ContentManager
            categories={categories}
            serviceCategories={serviceCategories}
            onContentChange={fetchData}
          />
        </TabsContent>

        <TabsContent value="add-bookmark" className="mt-6">
          <AddBookmarkForm
            categories={categories}
            onBookmarkAdded={fetchData}
          />
        </TabsContent>

        <TabsContent value="add-service" className="mt-6">
          <AddServiceForm
            serviceCategories={serviceCategories}
            onServiceAdded={fetchData}
          />
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <CSVImport onImportComplete={fetchData} />
        </TabsContent>

        <TabsContent value="categories" className="mt-6 space-y-6">
          <CategoryManager
            categories={categories}
            onCategoriesChange={fetchData}
          />
          <ServiceCategoryManager
            categories={serviceCategories}
            onCategoriesChange={fetchData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
