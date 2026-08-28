# HLM Run App

HLM Run App er en løbe-app til at beregne og planlægge træning, restitution og løbsstrategi.

Live app: https://allangraver.github.io/hlm_run_app/

## Hvad kan du bruge siderne til?

Appen indeholder flere værktøjer, der hjælper løbere med at træffe bedre beslutninger om træning og konkurrence:

- VDOT: Beregn din løbeform ud fra en nylig løbspræstation og få vejledende træningstempoer.
- VO₂max: Estimér din aerobe kapacitet ud fra enten Cooper-testen eller pulsdata.
- Træningsbelastning: Vurder om et træningspas er let, moderat eller hårdt i forhold til din samlede belastning.
- Restitution: Få et estimat af, hvor lang tid du bør vente før næste hårde træningspas.
- Løbsstrategi: Planlæg en realistisk pacingstrategi for 5 km, 10 km, halvmaraton eller maraton.
- Energistrategi: Se et forslag til energi, væske og salt under længere løb.
- Checklister: Gennemgå, om du er klar til løbet, og få styr på søvn, stress, smerter og motivation.
- Øvelsesbibliotek: Få inspiration til opvarmning, teknikdrills og løbeøvelser.

## Kør lokalt

```bash
npm install
npm run dev
```

Derefter åbner du http://localhost:3000.

## Deploy til GitHub Pages

Projektet er konfigureret til statisk eksport, så det kan hostes på GitHub Pages.

1. Push projektet til GitHub.
2. Aktiver GitHub Pages i repoets indstillinger.
3. Vælg "GitHub Actions" som kilde.
4. Workflowet i `.github/workflows/deploy-pages.yml` bygger og deployer appen automatisk.

## Teknologi

- Next.js
- React
- TypeScript
- Tailwind CSS
