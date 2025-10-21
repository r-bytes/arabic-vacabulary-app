# Database Setup

## Probleem: Database Timeout

Als je deze error ziet:
```
Error: connect ETIMEDOUT
```

Betekent dit dat de database niet bereikbaar is. De app werkt nog steeds met localStorage als fallback, maar voor productie heb je een database nodig.

```env
DB_HOST=your-db.connect.psdb.cloud
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=arabic_vocab
```

5. Voeg deze variables ook toe in Vercel (Settings → Environment Variables)

## Oplossing 1: Lokale MySQL

Als je lokaal wilt testen met MySQL:

### macOS:
```bash
brew install mysql
brew services start mysql
mysql -u root
```

### Maak database en tabellen:
```sql
CREATE DATABASE arabic_vocab;
USE arabic_vocab;

-- Folders tabel
CREATE TABLE folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cards tabel
CREATE TABLE cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ar TEXT NOT NULL,
  translit TEXT,
  nl TEXT,
  en TEXT,
  tags TEXT,
  folder_id INT NOT NULL,
  audio_url TEXT,
  tts_hint TEXT,
  srs_interval INT,
  srs_ease FLOAT,
  srs_due TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES folders(id)
);
```

### Configureer .env:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=arabic_vocab
```

## Oplossing 3: Alleen localStorage gebruiken

Als je geen database wilt gebruiken, werkt de app volledig met localStorage in de browser. Data blijft bewaard zolang je de browser cache niet leegmaakt.

**Voordelen:**
- Geen setup nodig
- Werkt direct
- Gratis

**Nadelen:**
- Data is alleen lokaal
- Niet gesynchroniseerd tussen apparaten
- Kan verloren gaan bij cache clear

## Database Status Checken

Bezoek: `http://localhost:3000/api/health`

Dit toont:
- ✅ Database verbinding status
- ✅ Welke environment variabelen zijn geconfigureerd

## Troubleshooting

### "ETIMEDOUT" Error
- Controleer of database credentials correct zijn
- Controleer of database online is
- Controleer firewall settings
- Voor PlanetScale: Zorg dat je IP whitelist is geconfigureerd

### "Access Denied"
- Verkeerde username/password
- User heeft geen permissies voor database

### App werkt niet
- Check `.env` file bestaat en is correct
- Herstart dev server na .env wijzigingen
- Check console voor specifieke errors

## Fallback Systeem

De app heeft automatisch fallback naar localStorage:
1. **Eerste keus:** MySQL database (persistent, sync-bare)
2. **Fallback:** Browser localStorage (lokaal, betrouwbaar)

Bij elke actie zie je een toast:
- ✅ Groen: Database save succesvol
- 🟡 Geel: Fallback naar localStorage (database niet beschikbaar)

