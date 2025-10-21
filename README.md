# Arabic Vocabulary App 📚

Een moderne web-app om Arabisch vocabulaire te leren met flashcards, quizzen en games.

## ✨ Features

- 📱 **Flashcards** - Leer met spaced repetition systeem (SRS)
- 🎯 **Quizzen** - Multiple choice en typ-oefeningen
- 🎮 **Memory Game** - Maak matching pairs
- 📸 **Camera Translate** - Scan Arabische tekst met je mobiel (zoals Google Translate)
- 📁 **Folders** - Organiseer je woordenschat in mappen
- 🎨 **Dark Mode** - Comfortabel leren in het donker
- 💾 **Auto-save** - Data wordt automatisch opgeslagen
- 🔄 **Offline-first** - Werkt zonder internet verbinding

## 🚀 Quick Start

```bash
# Installeer dependencies
pnpm install

# Start development server
pnpm dev

# Open browser
http://localhost:3000
```

## 📊 Database Setup

⚠️ **Belangrijk:** Als je database timeouts krijgt, zie [DATABASE_SETUP.md](./DATABASE_SETUP.md)

De app werkt out-of-the-box met localStorage als fallback. Voor productie raden we een MySQL database aan (bijvoorbeeld PlanetScale).

### Snelle setup (optioneel):

1. Kopieer `.env.example` naar `.env`
2. Vul database credentials in
3. Herstart dev server

Zonder database werkt alles nog steeds, maar data blijft alleen lokaal in je browser.

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand
- **Database:** MySQL (optioneel)
- **Storage:** localStorage (fallback)
- **OCR:** Tesseract.js
- **Translation:** LibreTranslate (gratis)
- **Animations:** Framer Motion

## 📱 Mobile Features

- Camera translate (alleen zichtbaar op mobiel)
- Touch-friendly interface
- Responsive design
- Offline support

## 🎯 Commands

```bash
pnpm dev          # Start development
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linter
```

## 🔧 Environment Variables

Optioneel - alleen nodig als je een database wilt gebruiken:

```env
DB_HOST=your-host
DB_PORT=3306
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=arabic_vocab
```

## 📖 Usage

1. **Kaarten toevoegen:** Klik op "Nieuwe kaart" en vul Arabisch + vertaling in
2. **Studeren:** Ga naar de Study pagina voor flashcards of quizzen
3. **Camera scan:** (Mobiel) Gebruik camera icoon om tekst te scannen
4. **Organiseren:** Maak mappen om je woordenschat te categoriseren

## 🤝 Contributing

1. Fork het project
2. Maak een feature branch
3. Commit je wijzigingen
4. Push naar de branch
5. Open een Pull Request

## 📄 License

MIT License - zie LICENSE file voor details

## 🐛 Troubleshooting

- **Database errors:** Zie [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Build fails:** Run `pnpm install` opnieuw
- **Data verloren:** Check of localStorage werkt in je browser
- **Camera werkt niet:** Geef browser camera permissies

## 🚀 Deploy

Deploy eenvoudig naar Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/r-bytes/arabic-vacabulary-app)

Vergeet niet om environment variables toe te voegen in Vercel settings!
