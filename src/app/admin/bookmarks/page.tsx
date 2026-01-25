'use client'

import { useEffect, useState } from 'react'
import { CategoryManager } from '@/components/admin/category-manager'
import { ServiceCategoryManager } from '@/components/admin/service-category-manager'
import { ContentManager } from '@/components/admin/content-manager'
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <ContentManager
            categories={categories}
            serviceCategories={serviceCategories}
            onContentChange={fetchData}
          />
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
