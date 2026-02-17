# Faux|Dash

A modern, self-hosted homepage dashboard for managing bookmarks and services. Built as a replacement for [Flame](https://github.com/pawelmalak/flame) with a modern tech stack.

> **Note**: This project was entirely built with AI assistance. Contributions welcome!

---

## ✨ Features

- 📚 **Bookmarks & Services** — Organize links into customizable categories
- 🔍 **Search** — DuckDuckGo, Google, Brave, Kagi, or custom search engines
- 🌤️ **Weather** — Multiple providers with multi-location support
- 📱 **PWA** — Install as a native app on mobile and desktop
- 🔐 **Auth** — Local login + OIDC/SSO (Authentik, Keycloak, Okta)
- 🎨 **Themes** — Light/Dark modes with multiple color accents
- 📊 **Analytics** — Click tracking + GeoIP visitor mapping
- 💾 **Backup** — Full backup/restore with CSV import/export
- 🖱️ **Drag & Drop** — Reorder everything easily
- ⚡ **Redis Cache** — Optional external Redis for improved performance

---

## 🚀 Quick Start

```bash
# Get the compose file
curl -O https://raw.githubusercontent.com/sdenike/fauxdash/master/docker-compose.sample.yml
mv docker-compose.sample.yml docker-compose.yml

# Start (that's it!)
docker compose up -d

# Access at http://localhost:8080
```

Complete the setup wizard to create your admin account. No manual configuration required!

---

## 📸 Screenshots

![Homepage Dark](docs/screenshots/homepage-dark.png)
![Admin Dashboard](docs/screenshots/admin-dashboard.png)

---

## ⚙️ Configuration

All settings are configured in **Admin > Settings**:

| Tab | Features |
|-----|----------|
| **General** | Search engine, welcome messages |
| **Weather** | Provider, locations, display options |
| **Appearance** | Theme, colors, layout, favicon, logo |
| **Email** | SMTP for password reset |
| **Auth** | OIDC/SSO configuration |
| **GeoIP** | Visitor location analytics |
| **Cache** | External Redis configuration |

### Zero Config Required

Faux|Dash auto-generates security secrets on first run. Just start the container and go!

### Optional Environment Variables

```env
NEXTAUTH_URL=http://localhost:8080  # Your deployment URL
PUID=1000                            # Container user ID
PGID=1000                            # Container group ID
```

---

## 🔄 Upgrade

```bash
docker compose pull
docker compose up -d
```

Migrations run automatically.

---

## ⚡ Redis Cache (Optional)

Redis is not included with Faux|Dash. To use Redis caching:

1. Run your own Redis server:
   ```bash
   docker run -d --name redis -p 6379:6379 redis:7-alpine
   ```

2. Configure in **Admin > Settings > Cache**

---

## 🛠️ Tech Stack

- **Next.js 16** with React 19
- **SQLite** with Drizzle ORM
- **Tailwind CSS** with shadcn/ui
- **NextAuth.js** for authentication

---

## 📖 Documentation

- [Quick Start Guide](docs/QUICK_START.md)
- [Deployment Guide](docs/DEPLOY.md)
- [OIDC Setup Guide](docs/OIDC-SETUP-GUIDE.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)

---

## 📝 License

MIT License

---

## 🙏 Acknowledgments

- Inspired by [Flame Dashboard](https://github.com/pawelmalak/flame)
- UI from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Heroicons](https://heroicons.com/), [MDI](https://materialdesignicons.com/), [selfh.st](https://selfh.st/icons/)
- Built with Claude AI
