# Behörden-Klartext

**Behörden-Klartext** analysiert deutsche Behördenbriefe und klassifiziert sie nach Dringlichkeit.  
Die Verarbeitung erfolgt vollständig lokal im Browser, sodass keine sensiblen Daten übertragen werden.

## Überblick

Viele behördliche Schreiben sind schwer verständlich oder zeitkritisch. Dieses Projekt hilft dabei, Briefe automatisch zu bewerten und visuell einzuordnen.

Die Einstufung erfolgt über eine regelbasierte Analyse (keine KI), die Schlüsselbegriffe erkennt und daraus einen Score berechnet.

## Features

- OCR-gestützte Verarbeitung von Behördenbriefen  
- Automatische Dringlichkeitsklassifizierung  
- Farbliche Bewertung (Rot / Gelb / Grün)  
- 100 % lokale Verarbeitung im Browser  
- Keine Datenübertragung an externe Server  
- Erweiterbare Regel-Engine  
- Mehrsprachigkeit vorbereitet (aktuell Deutsch)

## Tech Stack

- Next.js  
- TypeScript  
- Tailwind CSS  

## Installation

Repository klonen:

```bash
git clone https://github.com/user1223644/behoerden-klartext.git
cd behoerden-klartext
