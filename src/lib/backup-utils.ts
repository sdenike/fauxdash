/**
 * Shared utility functions for backup, export, and import operations
 */

// Helper to escape CSV fields
export function escapeCSV(value: string | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper to parse CSV line handling quoted values
export function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

// Helper to get exportable icon value (only named icons, not favicon paths)
export function getExportableIcon(icon: string | null): string {
  if (!icon) return '';

  // selfhst icons - export full value
  if (icon.startsWith('selfhst:')) {
    return icon;
  }

  // HeroIcon names - export the name (doesn't start with favicon: or /)
  if (!icon.startsWith('favicon:') && !icon.startsWith('/')) {
    return icon;
  }

  // Favicon icons - cannot be exported
  return '';
}

// Interface for bookmark data
export interface BookmarkData {
  name: string;
  description: string | null;
  url: string;
  icon: string | null;
  categoryName: string;
  order: number;
  isVisible: boolean;
  requiresAuth: boolean;
}

// Interface for service data
export interface ServiceData {
  name: string;
  description: string | null;
  url: string;
  icon: string | null;
  categoryName: string;
  order: number;
  isVisible: boolean;
  requiresAuth: boolean;
}

// Interface for category data
export interface CategoryData {
  name: string;
  icon: string | null;
  color: string | null;
  order: number;
  isCollapsed: boolean;
  showOpenAll: boolean;
}

// Generate CSV content for bookmarks
export function generateBookmarksCSV(bookmarks: BookmarkData[]): string {
  const headers = ['Name', 'Description', 'URL', 'Icon', 'Category', 'Order', 'Visible', 'RequiresAuth'];
  const rows = [headers.join(',')];

  for (const bookmark of bookmarks) {
    rows.push([
      escapeCSV(bookmark.name),
      escapeCSV(bookmark.description),
      escapeCSV(bookmark.url),
      escapeCSV(getExportableIcon(bookmark.icon)),
      escapeCSV(bookmark.categoryName),
      String(bookmark.order),
      bookmark.isVisible ? 'true' : 'false',
      bookmark.requiresAuth ? 'true' : 'false',
    ].join(','));
  }

  return rows.join('\n');
}

// Generate CSV content for services
export function generateServicesCSV(services: ServiceData[]): string {
  const headers = ['Name', 'Description', 'URL', 'Icon', 'Category', 'Order', 'Visible', 'RequiresAuth'];
  const rows = [headers.join(',')];

  for (const service of services) {
    rows.push([
      escapeCSV(service.name),
      escapeCSV(service.description),
      escapeCSV(service.url),
      escapeCSV(getExportableIcon(service.icon)),
      escapeCSV(service.categoryName),
      String(service.order),
      service.isVisible ? 'true' : 'false',
      service.requiresAuth ? 'true' : 'false',
    ].join(','));
  }

  return rows.join('\n');
}

// Generate CSV content for categories (bookmark or service)
export function generateCategoriesCSV(categories: CategoryData[]): string {
  const headers = ['Name', 'Icon', 'Color', 'Order', 'Collapsed', 'ShowOpenAll'];
  const rows = [headers.join(',')];

  for (const category of categories) {
    rows.push([
      escapeCSV(category.name),
      escapeCSV(getExportableIcon(category.icon)),
      escapeCSV(category.color),
      String(category.order),
      category.isCollapsed ? 'true' : 'false',
      category.showOpenAll ? 'true' : 'false',
    ].join(','));
  }

  return rows.join('\n');
}

// Parse bookmarks CSV
export function parseBookmarksCSV(csvContent: string): BookmarkData[] {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  const items: BookmarkData[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 5) continue;

    items.push({
      name: values[0] || '',
      description: values[1] || null,
      url: values[2] || '',
      icon: values[3] || null,
      categoryName: values[4] || 'Uncategorized',
      order: parseInt(values[5], 10) || 0,
      isVisible: values[6]?.toLowerCase() !== 'false',
      requiresAuth: values[7]?.toLowerCase() === 'true',
    });
  }

  return items;
}

// Parse services CSV
export function parseServicesCSV(csvContent: string): ServiceData[] {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  const items: ServiceData[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 5) continue;

    items.push({
      name: values[0] || '',
      description: values[1] || null,
      url: values[2] || '',
      icon: values[3] || null,
      categoryName: values[4] || 'Uncategorized',
      order: parseInt(values[5], 10) || 0,
      isVisible: values[6]?.toLowerCase() !== 'false',
      requiresAuth: values[7]?.toLowerCase() === 'true',
    });
  }

  return items;
}

// Parse categories CSV
export function parseCategoriesCSV(csvContent: string): CategoryData[] {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  const items: CategoryData[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 1) continue;

    items.push({
      name: values[0] || '',
      icon: values[1] || null,
      color: values[2] || null,
      order: parseInt(values[3], 10) || 0,
      isCollapsed: values[4]?.toLowerCase() === 'true',
      showOpenAll: values[5]?.toLowerCase() === 'true',
    });
  }

  return items;
}
