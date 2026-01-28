/**
 * Demo Content Data Definitions
 *
 * This file contains all demo bookmarks, services, and analytics data
 * that can be loaded for new users to explore Faux|Dash features.
 */

// Demo Bookmark Categories
export const demoBookmarkCategories = [
  {
    name: 'Development',
    icon: 'CodeBracketIcon',
    order: 0,
    columns: 1,
    isVisible: true,
    requiresAuth: false,
    itemsToShow: 10,
    showItemCount: true,
    autoExpanded: false,
    showOpenAll: true,
    sortBy: 'order',
    isDemo: true,
  },
  {
    name: 'Social & News',
    icon: 'NewspaperIcon',
    order: 1,
    columns: 1,
    isVisible: true,
    requiresAuth: false,
    itemsToShow: 10,
    showItemCount: true,
    autoExpanded: false,
    showOpenAll: true,
    sortBy: 'order',
    isDemo: true,
  },
  {
    name: 'Productivity',
    icon: 'ClipboardDocumentListIcon',
    order: 2,
    columns: 1,
    isVisible: true,
    requiresAuth: false,
    itemsToShow: 10,
    showItemCount: true,
    autoExpanded: false,
    showOpenAll: true,
    sortBy: 'order',
    isDemo: true,
  },
  {
    name: 'Shopping',
    icon: 'ShoppingCartIcon',
    order: 3,
    columns: 1,
    isVisible: true,
    requiresAuth: false,
    itemsToShow: 10,
    showItemCount: true,
    autoExpanded: false,
    showOpenAll: true,
    sortBy: 'order',
    isDemo: true,
  },
];

// Demo Bookmarks by category name
export const demoBookmarks: Record<string, Array<{
  name: string;
  url: string;
  description: string | null;
  icon: string;
  order: number;
}>> = {
  Development: [
    {
      name: 'GitHub',
      url: 'https://github.com',
      description: 'Code hosting and collaboration platform',
      icon: 'selfhst:github',
      order: 0,
    },
    {
      name: 'Stack Overflow',
      url: 'https://stackoverflow.com',
      description: 'Programming Q&A community',
      icon: 'selfhst:stackoverflow',
      order: 1,
    },
    {
      name: 'MDN Web Docs',
      url: 'https://developer.mozilla.org',
      description: 'Comprehensive web development documentation',
      icon: 'selfhst:mozilla',
      order: 2,
    },
    {
      name: 'VS Code Web',
      url: 'https://vscode.dev',
      description: 'Browser-based code editor',
      icon: 'selfhst:vscode',
      order: 3,
    },
  ],
  'Social & News': [
    {
      name: 'Reddit',
      url: 'https://reddit.com',
      description: 'Social news aggregation and discussion',
      icon: 'selfhst:reddit',
      order: 0,
    },
    {
      name: 'Hacker News',
      url: 'https://news.ycombinator.com',
      description: 'Tech and startup news',
      icon: 'selfhst:hackernews',
      order: 1,
    },
    {
      name: 'Twitter / X',
      url: 'https://x.com',
      description: 'Social media and microblogging',
      icon: 'selfhst:x',
      order: 2,
    },
    {
      name: 'YouTube',
      url: 'https://youtube.com',
      description: 'Video sharing platform',
      icon: 'selfhst:youtube',
      order: 3,
    },
  ],
  Productivity: [
    {
      name: 'Google Drive',
      url: 'https://drive.google.com',
      description: 'Cloud storage and file sharing',
      icon: 'selfhst:google-drive',
      order: 0,
    },
    {
      name: 'Notion',
      url: 'https://notion.so',
      description: 'All-in-one workspace for notes and docs',
      icon: 'selfhst:notion',
      order: 1,
    },
    {
      name: 'Trello',
      url: 'https://trello.com',
      description: 'Visual project management boards',
      icon: 'selfhst:trello',
      order: 2,
    },
    {
      name: 'Slack',
      url: 'https://slack.com',
      description: 'Team communication and collaboration',
      icon: 'selfhst:slack',
      order: 3,
    },
  ],
  Shopping: [
    {
      name: 'Amazon',
      url: 'https://amazon.com',
      description: 'Online marketplace',
      icon: 'selfhst:amazon',
      order: 0,
    },
    {
      name: 'eBay',
      url: 'https://ebay.com',
      description: 'Online auction and shopping',
      icon: 'selfhst:ebay',
      order: 1,
    },
    {
      name: 'Best Buy',
      url: 'https://bestbuy.com',
      description: 'Electronics and appliances retailer',
      icon: 'ShoppingBagIcon',
      order: 2,
    },
  ],
};

// Demo Service Categories
export const demoServiceCategories = [
  {
    name: 'Infrastructure',
    icon: 'ServerIcon',
    order: 0,
    columns: 1,
    isVisible: true,
    requiresAuth: false,
    itemsToShow: 10,
    showItemCount: true,
    autoExpanded: false,
    showOpenAll: true,
    sortBy: 'order',
    isDemo: true,
  },
  {
    name: 'Media',
    icon: 'FilmIcon',
    order: 1,
    columns: 1,
    isVisible: true,
    requiresAuth: false,
    itemsToShow: 10,
    showItemCount: true,
    autoExpanded: false,
    showOpenAll: true,
    sortBy: 'order',
    isDemo: true,
  },
  {
    name: 'Network',
    icon: 'GlobeAltIcon',
    order: 2,
    columns: 1,
    isVisible: true,
    requiresAuth: false,
    itemsToShow: 10,
    showItemCount: true,
    autoExpanded: false,
    showOpenAll: true,
    sortBy: 'order',
    isDemo: true,
  },
];

// Demo Services by category name
export const demoServices: Record<string, Array<{
  name: string;
  url: string;
  description: string | null;
  icon: string;
  order: number;
}>> = {
  Infrastructure: [
    {
      name: 'Proxmox',
      url: 'http://proxmox.local:8006',
      description: 'Virtual environment management',
      icon: 'selfhst:proxmox',
      order: 0,
    },
    {
      name: 'TrueNAS',
      url: 'http://truenas.local',
      description: 'Network-attached storage system',
      icon: 'selfhst:truenas',
      order: 1,
    },
    {
      name: 'Unraid',
      url: 'http://unraid.local',
      description: 'Server operating system for NAS',
      icon: 'selfhst:unraid',
      order: 2,
    },
    {
      name: 'Portainer',
      url: 'http://portainer.local:9000',
      description: 'Container management platform',
      icon: 'selfhst:portainer',
      order: 3,
    },
  ],
  Media: [
    {
      name: 'Plex',
      url: 'http://plex.local:32400',
      description: 'Media server and streaming',
      icon: 'selfhst:plex',
      order: 0,
    },
    {
      name: 'Jellyfin',
      url: 'http://jellyfin.local:8096',
      description: 'Free software media system',
      icon: 'selfhst:jellyfin',
      order: 1,
    },
    {
      name: 'Sonarr',
      url: 'http://sonarr.local:8989',
      description: 'TV series management',
      icon: 'selfhst:sonarr',
      order: 2,
    },
    {
      name: 'Radarr',
      url: 'http://radarr.local:7878',
      description: 'Movie collection manager',
      icon: 'selfhst:radarr',
      order: 3,
    },
  ],
  Network: [
    {
      name: 'Pi-hole',
      url: 'http://pihole.local/admin',
      description: 'Network-wide ad blocking',
      icon: 'selfhst:pi-hole',
      order: 0,
    },
    {
      name: 'Nginx Proxy Manager',
      url: 'http://npm.local:81',
      description: 'Reverse proxy management',
      icon: 'selfhst:nginx-proxy-manager',
      order: 1,
    },
    {
      name: 'Uptime Kuma',
      url: 'http://uptime.local:3001',
      description: 'Self-hosted monitoring tool',
      icon: 'selfhst:uptime-kuma',
      order: 2,
    },
  ],
};

// Geographic distribution for demo analytics
export const demoGeoDistribution = [
  { country: 'US', countryName: 'United States', weight: 60 },
  { country: 'GB', countryName: 'United Kingdom', weight: 15 },
  { country: 'DE', countryName: 'Germany', weight: 10 },
  { country: 'CA', countryName: 'Canada', weight: 5 },
  { country: 'AU', countryName: 'Australia', weight: 5 },
  { country: 'FR', countryName: 'France', weight: 3 },
  { country: 'JP', countryName: 'Japan', weight: 2 },
];

/**
 * Generate random demo pageviews for a date range
 */
export function generateDemoPageviews(days: number = 30): Array<{
  path: string;
  country: string;
  countryName: string;
  timestamp: number;
  isDemo: boolean;
}> {
  const pageviews: Array<{
    path: string;
    country: string;
    countryName: string;
    timestamp: number;
    isDemo: boolean;
  }> = [];
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  for (let day = 0; day < days; day++) {
    const dayStart = now - (day * msPerDay);
    const isWeekend = new Date(dayStart).getDay() % 6 === 0;

    // More pageviews on weekdays
    const basePageviews = isWeekend ? 15 : 40;
    const variance = Math.floor(Math.random() * 30);
    const dailyPageviews = basePageviews + variance;

    for (let i = 0; i < dailyPageviews; i++) {
      // Random time during the day
      const timestamp = Math.floor((dayStart - Math.random() * msPerDay) / 1000);

      // Pick a country based on weight distribution
      const geo = pickWeightedRandom(demoGeoDistribution);

      pageviews.push({
        path: '/',
        country: geo.country,
        countryName: geo.countryName,
        timestamp,
        isDemo: true,
      });
    }
  }

  return pageviews;
}

/**
 * Generate random demo clicks for bookmarks/services
 */
export function generateDemoClicks(
  itemIds: number[],
  type: 'bookmark' | 'service',
  days: number = 30
): Array<{
  itemId: number;
  clickedAt: number;
  hourOfDay: number;
  dayOfWeek: number;
  dayOfMonth: number;
  isDemo: boolean;
}> {
  const clicks: Array<{
    itemId: number;
    clickedAt: number;
    hourOfDay: number;
    dayOfWeek: number;
    dayOfMonth: number;
    isDemo: boolean;
  }> = [];
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;

  for (let day = 0; day < days; day++) {
    const dayStart = now - (day * msPerDay);
    const isWeekend = new Date(dayStart).getDay() % 6 === 0;

    // Fewer clicks than pageviews
    const baseClicks = isWeekend ? 3 : 12;
    const variance = Math.floor(Math.random() * 10);
    const dailyClicks = baseClicks + variance;

    for (let i = 0; i < dailyClicks; i++) {
      // Random time during the day
      const clickTime = new Date(dayStart - Math.random() * msPerDay);
      const clickedAt = Math.floor(clickTime.getTime() / 1000);

      // Pick a random item
      const itemId = itemIds[Math.floor(Math.random() * itemIds.length)];

      clicks.push({
        itemId,
        clickedAt,
        hourOfDay: clickTime.getHours(),
        dayOfWeek: clickTime.getDay(),
        dayOfMonth: clickTime.getDate(),
        isDemo: true,
      });
    }
  }

  return clicks;
}

/**
 * Helper: Pick a random item based on weights
 */
function pickWeightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}
