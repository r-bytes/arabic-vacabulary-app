# Multi-User Setup Guide

Deze gids helpt je bij het opzetten van multi-user support voor de Arabic Vocabulary App.

## 🚀 Stappen

### 1. Database Migratie

Voer de migratie script uit in je MySQL database:

```bash
mysql -u your_user -p your_database < scripts/migrate-users.sql
```

Of voer het SQL script handmatig uit in phpMyAdmin / MySQL client.

**Belangrijk:** Dit voegt toe:
- `users` tabel voor gebruikers
- `accounts`, `sessions`, `verification_tokens` tabellen voor NextAuth
- `user_id` kolommen aan `folders` en `cards` tabellen
- Migreert bestaande data naar een "system" gebruiker

**Als je een foreign key error krijgt (#1005):**
1. Gebruik het handmatige script: `scripts/migrate-users-manual.sql` - voer de stappen één voor één uit
2. Of voer eerst het verificatie script uit: `scripts/verify-migration.sql` om te zien wat er mis is
3. Het automatische script probeert bestaande foreign keys te verwijderen, maar soms moet je dit handmatig doen

### 2. Environment Variables

Voeg toe aan je `.env` bestand (webapp):

```env
# NextAuth configuratie
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Optioneel: Google OAuth (voor Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**NEXTAUTH_SECRET genereren:**
```bash
openssl rand -base64 32
```

Voor productie (Vercel), voeg deze toe in Vercel Dashboard → Settings → Environment Variables.

### 3. Installatie

Dependencies zijn al geïnstalleerd:
- `next-auth@beta` - Authenticatie
- `bcryptjs` - Password hashing

### 4. Testen

#### Webapp
1. Start de dev server: `pnpm dev`
2. Ga naar `http://localhost:3000`
3. Je wordt doorgestuurd naar `/auth/signin`
4. Log in met email/password (auto-registratie bij eerste keer)
5. Of gebruik Google login (als geconfigureerd)

#### Mobile App
1. Start de mobile app: `npx expo start`
2. Bij eerste start: je wordt doorgestuurd naar login screen
3. Log in met dezelfde credentials als webapp
4. Token wordt opgeslagen in AsyncStorage

## 📱 Mobile App Auth

De mobile app gebruikt een aparte auth endpoint (`/api/auth/mobile`) die een user ID token teruggeeft. Dit token wordt:
- Opgeslagen in AsyncStorage
- Meegestuurd als `Authorization: Bearer <token>` header bij alle API calls
- Automatisch gecontroleerd in `lib/auth-helpers.ts`

## 🔒 Security Notes

**Voor productie:**
1. **JWT Tokens**: Vervang de huidige user ID tokens met JWT tokens voor betere security
2. **HTTPS**: Gebruik altijd HTTPS in productie
3. **Rate Limiting**: Voeg rate limiting toe aan login endpoints
4. **Password Requirements**: Voeg password strength requirements toe
5. **Email Verification**: Implementeer email verificatie voor nieuwe accounts

## 🛠️ Aanpassingen

### Database Schema
- `users` - Gebruikers accounts
- `accounts` - OAuth provider accounts (NextAuth)
- `sessions` - NextAuth sessies
- `folders.user_id` - Foreign key naar users
- `cards.user_id` - Foreign key naar users

### API Routes
Alle API routes (`/api/folders`, `/api/cards`) zijn nu beveiligd:
- Controleren authentication (web: NextAuth session, mobile: Bearer token)
- Filteren data op `user_id`
- Valideren dat resources bij de gebruiker horen

### Webapp
- Login/logout UI toegevoegd
- Auth button in header
- Automatische redirect naar login als niet ingelogd
- Session provider in root layout

### Mobile App
- Login screen (`app/auth/login.tsx`)
- Auth token management (`lib/auth.ts`)
- Automatische auth headers in API calls (`lib/api.ts`)
- Error handling voor 401 Unauthorized

## 🐛 Troubleshooting

**"Unauthorized" errors:**
- Check of je ingelogd bent
- Voor mobile: check of token in AsyncStorage staat
- Voor web: check of NextAuth session actief is

**Database errors:**
- Check of migratie script is uitgevoerd
- Check of `user_id` kolommen bestaan
- Check foreign key constraints
- **Foreign key error (#1005):** Gebruik `scripts/migrate-users-manual.sql` en voer stappen handmatig uit
- **Verificatie:** Voer `scripts/verify-migration.sql` uit om te controleren of alles correct is

**"Ik zie alle kaartjes van andere gebruikers":**
- Dit betekent dat de migratie niet volledig is uitgevoerd
- Check of `user_id` kolommen bestaan: `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'cards' AND COLUMN_NAME = 'user_id'`
- Check of alle kaartjes een `user_id` hebben: `SELECT COUNT(*) FROM cards WHERE user_id IS NULL` (moet 0 zijn)
- Voer het verificatie script uit: `scripts/verify-migration.sql`
- Als er NULL waarden zijn, voer uit: `UPDATE cards SET user_id = 'system' WHERE user_id IS NULL` (en hetzelfde voor folders)

**Login werkt niet:**
- Check `.env` bestand met `NEXTAUTH_SECRET`
- Check database connectie
- Check console voor errors

## 👑 Admin Functionaliteit

### Admin Setup

1. **Voer admin role migratie uit:**
   ```bash
   mysql -u your_user -p your_database < scripts/add-admin-role.sql
   ```

2. **Maak een gebruiker admin:**
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'jouw-email@example.com';
   ```

### Admin Features

Admins hebben toegang tot `/admin` waar ze kunnen:

- **Gebruikersbeheer:**
  - Alle gebruikers zien
  - Rollen wijzigen (user/admin)
  - Laatste admin kan niet worden verwijderd (bescherming)

- **Data Toewijzing:**
  - Alle folders en kaarten zien (van alle gebruikers)
  - Folders/kaarten toewijzen aan gebruikers
  - Bulk selectie en toewijzing

### Admin Navigatie

Admins zien een "Admin Panel" link in het gebruikersmenu (klik op het gebruikersicoon rechtsboven).

## 📝 Volgende Stappen

1. Implementeer JWT tokens voor mobile (i.p.v. user ID)
2. Voeg password reset functionaliteit toe
3. Voeg email verificatie toe
4. Voeg user profile pagina toe

