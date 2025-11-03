# Cotells — Digitalt Samtidsbarometer (MVP startpakke)

Dette er en enkel startpakke for å få **cotells.com** på lufta raskt (landingsside + demo).

## Rask utrulling (uten kode)
1. Lag en tom GitHub-repo og last opp filene i denne mappen.
2. Koble repo til **Vercel** eller **Netlify** (gratis tier funker).
3. Sett domene *cotells.com* til å peke til Vercel/Netlify (CNAME + A-record).
4. Ferdig — landingssiden går live på få minutter.

## Videre plan (no-code + AI)
- **Back-end/DB:** Bubble (Data-tabeller under), Webhooks for avstemninger og nyhetsfeed.
- **AI:** OpenAI GPT for spørsmålsgenerering og klassifisering.
- **Integrasjoner:** NewsAPI (eller GDELT/MediaCloud), Supabase (logging), PostHog (analytics).
- **Scheduler:** cron (Make.com/Cloudflare Workers) for hver 30. minutt.

## Data-modell (Bubble)
- **Topic**: id, title, summary, momentum_score, created_at
- **NewsItem**: id, topic_id, source, author, url, published_at, sentiment
- **Question**: id, topic_id, text, stance_labels[Ja/Nei/Usikker], lang (no/en)
- **Vote**: id, question_id, user_id (nullable), choice, ip_hash, created_at
- **Panel**: id, name, invite_code, description
- **PanelMember**: id, panel_id, user_id, role
- **User**: id, email, role, created_at

## API (OpenAPI skisse)
Se `api_spec.yaml` for endepunkter. Koble til Bubble API/data og webhooks.

## Prompter (kort)
- `summarize_news(title, body) -> summary, sentiment, stance`
- `generate_question(topic_summary) -> 1–2 setninger, balansert`
- `classify_vote_text(text) -> Ja/Nei/Usikker`

## Sikkerhet
- Hash IP for å begrense dobbeltstemmer.
- Rate limiting på POST /votes.
- Moderasjon på spørsmål (manuelt flagg + simple rules).

## Neste milepæler
1. Live nyhetsfeed (RSS + NewsAPI) → Topic clustering
2. Automatisk spørsmål → pilotpanel
3. Offentlige widget-embeds
