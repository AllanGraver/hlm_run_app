"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Gauge,
  Info,
  Printer,
  RotateCcw,
  Save,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  X,
} from "lucide-react";


const STORAGE_KEY = "vdot-calculations";


const races = [
  { name: "1500 m", km: 1.5 },
  { name: "3 km", km: 3 },
  { name: "5 km", km: 5 },
  { name: "10 km", km: 10 },
  { name: "Halvmaraton", km: 21.0975 },
  { name: "Maraton", km: 42.195 },
];

const zoneConfig = [
  { key: "E", name: "Roligt tempo", purpose: "Restitution, grundtræning og de fleste rolige ture.", guidance: "Du skal kunne føre en samtale i hele sætninger.", low: 0.59, high: 0.74, color: "bg-emerald-500", soft: "border-emerald-400/20 bg-emerald-400/5" },
  { key: "M", name: "Maratontempo", purpose: "Længere, kontrollerede tempoblokke og maratonspecifik træning.", guidance: "Stabilt og fokuseret, men ikke maksimalt.", low: 0.75, high: 0.84, color: "bg-lime-500", soft: "border-lime-400/20 bg-lime-400/5" },
  { key: "T", name: "Tærskeltempo", purpose: "Tempoture og intervaller, der forbedrer evnen til at holde høj fart.", guidance: "Kontrolleret hårdt. Du kan kun sige få ord ad gangen.", low: 0.83, high: 0.88, color: "bg-amber-500", soft: "border-amber-400/20 bg-amber-400/5" },
  { key: "I", name: "Intervaltempo", purpose: "Hårde intervaller på typisk 3–5 minutter med pause imellem.", guidance: "Hårdt, men med god teknik gennem hele passet.", low: 0.95, high: 1.0, color: "bg-rose-500", soft: "border-rose-400/20 bg-rose-400/5" },
  { key: "R", name: "Repetitionstempo", purpose: "Korte, hurtige gentagelser med god pause og fokus på løbeøkonomi.", guidance: "Hurtigt og afslappet. Stop før teknikken bliver dårlig.", low: 1.05, high: 1.1, color: "bg-violet-500", soft: "border-violet-400/20 bg-violet-400/5" },
];

const vo2Norms = [
  { age: "20–29", men: [35, 43, 51, 56], women: [27, 36, 44, 49] },
  { age: "30–39", men: [33, 41, 49, 54], women: [25, 34, 42, 47] },
  { age: "40–49", men: [30, 38, 46, 51], women: [23, 31, 39, 44] },
  { age: "50–59", men: [26, 34, 42, 47], women: [20, 28, 36, 41] },
  { age: "60–69", men: [22, 30, 38, 43], women: [17, 25, 33, 38] },
  { age: "70+", men: [18, 26, 34, 39], women: [15, 22, 30, 35] },
] as const;

function vo2FromCooper(distanceMeters: number) {
  return (distanceMeters - 504.9) / 44.73;
}

function vo2FromHeartRate(maxHeartRate: number, restingHeartRate: number) {
  return 15.3 * (maxHeartRate / restingHeartRate);
}

type SavedCalculation = {
  id: number;
  savedAt: string;
  distanceKm: number;
  distanceName: string;
  hours: number;
  minutes: number;
  seconds: number;
  vdot: number;
};

type PageKey = "home" | "vdot" | "vo2max" | "training-load" | "recovery" | "race-strategy" | "energy-strategy" | "exercises" | "checklists";

type NavigationPage = { key: PageKey; label: string };

const navigationSections: Array<{ label: string; icon: typeof Gauge; pages: NavigationPage[] }> = [
  { label: "Oversigt", icon: Activity, pages: [{ key: "home", label: "Startside" }] },
  { label: "Performance", icon: Gauge, pages: [{ key: "vdot", label: "VDOT" }, { key: "vo2max", label: "VO₂max" }] },
  { label: "Træning", icon: Activity, pages: [{ key: "training-load", label: "Træningsbelastning" }, { key: "recovery", label: "Restitution" }] },
  { label: "Konkurrence", icon: Trophy, pages: [{ key: "race-strategy", label: "Løbsstrategi" }, { key: "energy-strategy", label: "Energistrategi" }, { key: "checklists", label: "Checklister" }] },
  { label: "Øvelsesbibliotek", icon: Target, pages: [{ key: "exercises", label: "Øvelsesbibliotek" }] },
] as const;

const pageExplanations: Record<PageKey, { result: string; benefit: string }> = {
  home: { result: "Hvad kan jeg bruge denne app til?", benefit: "Her får du et hurtigt overblik over de vigtigste værktøjer i appen, så du kan vælge det, der passer til det træningstrin eller løb, du står i." },
  vdot: { result: "Hvor god er min nuværende form?", benefit: "Du får et samlet mål for din løbeform samt vejledende træningstempoer, så dine rolige ture, tærskelpas og intervaller kan planlægges mere præcist." },
  vo2max: { result: "Hvor effektivt kan min krop optage og bruge ilt?", benefit: "Du får et estimat af din aerobe kapacitet og kan følge, om din kondition udvikler sig over tid. Det er et træningsværktøj, ikke en klinisk måling." },
  "training-load": { result: "Træner jeg for hårdt eller for lidt?", benefit: "Du får et overblik over din samlede belastning, så du kan skabe progression uden at øge risikoen for overbelastning unødigt." },
  recovery: { result: "Er jeg klar til næste hårde træningspas?", benefit: "Du får hjælp til at vurdere balancen mellem træning og hvile, så du kan vælge den rigtige intensitet på dagen." },
  "race-strategy": { result: "Hvordan fordeler jeg kræfterne i løbet?", benefit: "Du får hjælp til at vælge en realistisk åbning, holde den rigtige fart og disponere kræfterne hele vejen til mål." },
  "energy-strategy": { result: "Hvor meget energi, væske og salt bør jeg indtage?", benefit: "Du får en konkret plan for indtag under længere løb, så du kan øve strategien i træningen og møde konkurrencen bedre forberedt." },
  exercises: { result: "Hvilke øvelser kan jeg bruge i min træning?", benefit: "Du får inspiration til løbe- og styrkeøvelser, som kan gøre opvarmning, tekniktræning og kvalitetspas mere målrettede." },
  checklists: { result: "Er jeg klar til løbet?", benefit: "Du får et hurtigt overblik over søvn, stress, ømhed og motivation samt praktiske checklister til før, under og efter konkurrencen." },
};


function oxygenCost(v: number) {
  return -4.6 + 0.182258 * v + 0.000104 * v * v;
}

function sustainableFraction(minutes: number) {
  return 0.8 + 0.1894393 * Math.exp(-0.012778 * minutes) + 0.2989558 * Math.exp(-0.1932605 * minutes);
}

function vdotFor(distanceKm: number, minutes: number) {
  return oxygenCost((distanceKm * 1000) / minutes) / sustainableFraction(minutes);
}

function velocityForOxygen(vo2: number) {
  const a = 0.000104;
  const b = 0.182258;
  const c = -4.6 - vo2;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

function predictedMinutes(distanceKm: number, targetVDOT: number) {
  let low = 2;
  let high = 600;
  for (let i = 0; i < 80; i++) {
    const mid = (low + high) / 2;
    if (vdotFor(distanceKm, mid) > targetVDOT) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

function formatTime(totalMinutes: number) {
  const sec = Math.round(totalMinutes * 60);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function formatPace(minutesPerKm: number) {
  if (!Number.isFinite(minutesPerKm) || minutesPerKm <= 0) return "–";
  const sec = Math.round(minutesPerKm * 60);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function getVdotExplanation(vdot: number) {
  if (vdot < 30) return { title: "Du er ved at opbygge din løbeform", text: "Prioritér kontinuitet, rolige ture og gradvis progression frem for mange hårde pas." };
  if (vdot < 40) return { title: "Du har en solid motionsløberform", text: "Du har et godt aerobt fundament. Udvikl det med rolige ture, ét kvalitetspas og en ugentlig længere tur." };
  if (vdot < 50) return { title: "Du har en stærk, veltrænet løbeform", text: "Fortsat fremgang kræver god balance mellem kvalitet, samlet træningsmængde og restitution." };
  if (vdot < 60) return { title: "Du har et meget højt løbeniveau", text: "Små forbedringer kræver typisk præcis træningsstyring og god distancespecifik forberedelse." };
  return { title: "Du har et særdeles højt løbeniveau", text: "Brug beregningen som støtte til individuel planlægning, restitution og belastningsstyring." };
}

function getLoadLevel(load: number) {
  if (load < 150) return { label: "Let belastning", color: "text-emerald-300", advice: "Passer typisk til en rolig dag eller aktiv restitution." };
  if (load < 300) return { label: "Moderat belastning", color: "text-amber-300", advice: "En normal træningsbelastning. Sørg for at følge op med passende restitution." };
  if (load < 450) return { label: "Høj belastning", color: "text-orange-300", advice: "Planlæg gerne en rolig dag bagefter, især hvis du ikke er vant til denne belastning." };
  return { label: "Meget høj belastning", color: "text-rose-300", advice: "Prioritér restitution og undgå at lægge flere hårde pas tæt efter hinanden." };
}

const recoveryIntensity = {
  recovery: { label: "Meget rolig tur", factor: 0.45, base: 5 },
  easy: { label: "Rolig aerob tur", factor: 0.7, base: 8 },
  steady: { label: "Moderat tur", factor: 0.92, base: 12 },
  tempo: { label: "Tempo eller tærskel", factor: 1.22, base: 20 },
  interval: { label: "Intervaller eller bakker", factor: 1.4, base: 26 },
  long: { label: "Lang tur", factor: 1.12, base: 18 },
  race: { label: "Konkurrence eller test", factor: 1.5, base: 32 },
} as const;

function recoveryAdvice(hours: number) {
  if (hours <= 12) return "Du kan normalt genoptage let løb, hvis benene føles friske.";
  if (hours <= 30) return "Vælg en rolig tur eller hvile, før du lægger endnu et hårdt pas.";
  if (hours <= 54) return "Planlæg ekstra søvn og hold næste pas roligt eller meget let.";
  return "Prioritér restitution. Vent med kvalitetstræning, og reager på vedvarende smerter.";
}

const raceStrategyProfiles = {
  even: { label: "Jævn fart", splits: [1, 1, 1, 1, 1] },
  negative: { label: "Negativ split", splits: [1.02, 1.01, 1, 0.98, 0.97] },
  positive: { label: "Positiv split", splits: [0.97, 0.98, 1, 1.02, 1.03] },
  progressive: { label: "Progressiv fart", splits: [1.04, 1.02, 1, 0.98, 0.96] },
} as const;

const raceChecklistGroups = [
  { title: "24 timer før", items: ["Tjek starttid, transport og vejrudsigten", "Pak startnummer, tidtagningschip og sikkerhedsnåle", "Læg løbesko, strømper, tøj og skiftetøj frem", "Planlæg morgenmad og eventuel energi under løbet", "Drik normalt gennem dagen og undgå at eksperimentere", "Gå tidligt i seng og prioriter ro frem for ekstra træning"] },
  { title: "Løbsmorgen", items: ["Spis din velkendte morgenmad i god tid", "Drik lidt vand, men undgå at overdrikke", "Smør steder, der plejer at give irritation eller vabler", "Tjek startnummer, toiletbesøg og transporttid", "Tag tøj på efter vejret og med mulighed for et ekstra lag"] },
  { title: "15 minutter før start", items: ["Lav en rolig opvarmning og et par korte stigninger", "Find det rigtige startfelt efter dit måltempo", "Start uret og gør din pacingplan klar", "Mind dig selv om at åbne kontrolleret"] },
  { title: "Under løbet", items: ["Hold dig til planlagt indsats, især de første kilometer", "Drik ved behov og følg din aftalte energiplan", "Lad bakker og varme påvirke indsatsen, ikke din motivation", "Vurder planen igen ved næste kilometer eller væskestation"] },
  { title: "Efter mål", items: ["Gå roligt rundt, indtil vejrtrækningen er faldet til ro", "Få væske og noget at spise inden for den første time", "Skift til tørt eller varmt tøj", "Skriv kort ned, hvad der fungerede til næste løb"] },
] as const;

const runningDrills = [
  { name: "Ankling", category: "Løbeteknik", focus: "Fodisæt og stiv ankel", description: "Små, hurtige skridt med aktiv ankel og en let fremadrettet kropsholdning.", dosage: "2 x 20 m", cue: "Land under kroppen og hold overkroppen høj." },
  { name: "Høje knæløft", category: "Aktivering", focus: "Hoftedriv og rytme", description: "Løb fremad med aktive arme og løft knæet kontrolleret til omtrent hoftehøjde.", dosage: "2 x 20 m", cue: "Hold kontakten med underlaget kort og let." },
  { name: "Hælspark", category: "Aktivering", focus: "Bagkæde og benfrekvens", description: "Før hælen hurtigt mod sædet, mens knæene peger ned og bevægelsen forbliver afslappet.", dosage: "2 x 20 m", cue: "Tænk hurtige fødder frem for store bevægelser." },
  { name: "A-skip", category: "Koordination", focus: "Knæløft og timing", description: "Kombinér et aktivt knæløft med et elastisk afsæt og en tydelig armbevægelse.", dosage: "2 x 20 m", cue: "Find en jævn rytme, før du øger farten." },
  { name: "Straight-leg bounds", category: "Styrke og elasticitet", focus: "Læg og hofte", description: "Bevæg dig fremad med næsten strakte ben og et kort, elastisk afsæt fra forfoden.", dosage: "2 x 20 m", cue: "Start roligt og stop, hvis teknikken bliver tung." },
  { name: "Stigningsløb", category: "Fart og teknik", focus: "Acceleration", description: "Accelerér gradvist over en kort distance uden at sprinte, så teknikken kan forblive afslappet.", dosage: "4–6 x 60–80 m", cue: "Byg farten op og gå roligt tilbage som pause." },
] as const;

const runningWorkouts = [
  { name: "Teknik og rytme", level: "Alle niveauer", duration: "10–12 min", purpose: "Skab en bedre løberytme før en rolig tur eller et kvalitetspas.", steps: ["Ankling · 2 x 20 m", "Høje knæløft · 2 x 20 m", "A-skip · 2 x 20 m", "Stigningsløb · 3 x 60 m"] },
  { name: "Acceleration", level: "Let øvet", duration: "12–15 min", purpose: "Væk benene og øv gradvis fart uden at sprinte fra første skridt.", steps: ["Hælspark · 2 x 20 m", "A-skip · 2 x 20 m", "Straight-leg bounds · 2 x 20 m", "Stigningsløb · 5 x 80 m"] },
  { name: "Løbeøkonomi", level: "Øvet", duration: "15–18 min", purpose: "Kombinér koordination, elasticitet og korte fartimpulser med god kontrol.", steps: ["Ankling · 2 x 20 m", "Høje knæløft · 2 x 20 m", "Straight-leg bounds · 3 x 20 m", "Stigningsløb · 6 x 80 m"] },
  { name: "3 minutters løbeopvarmning", level: "Alle niveauer", duration: "3–5 min", purpose: "Gør kroppen klar til løb med en enkel opvarmning, der kan udføres næsten overalt.", steps: ["March på stedet · 30 sek", "Hælspark · 30 sek", "Høje knæløft · 30 sek", "Rolig jog og armcirkler · 90 sek"] },
  { name: "Speed drills", level: "Alle niveauer", duration: "8–12 min", purpose: "Forbered rytme, koordination og løbemekanik før hurtigere træning.", steps: ["Ankling · 2 x 20 m", "A-skip · 2 x 20 m", "Høje knæløft · 2 x 20 m", "Stigningsløb · 4 x 60 m"] },
  { name: "Dynamisk hofteopvarmning", level: "Alle niveauer", duration: "6–8 min", purpose: "Løsn hofterne og skab bedre bevægelighed, før du øger løbefarten.", steps: ["Bensving frem og tilbage · 10 pr. ben", "Bensving side til side · 10 pr. ben", "Gående udfald · 2 x 10 m", "Udfald med rotation · 2 x 6 pr. side"] },
  { name: "Dynamiske løbedrills", level: "Let øvet", duration: "10–14 min", purpose: "Saml rytme, kropsholdning og koordination i en fokuseret sekvens før kvalitetspas.", steps: ["Ankling · 2 x 20 m", "Hælspark · 2 x 20 m", "A-skip · 2 x 20 m", "Stigningsløb · 4 x 80 m"] },
  { name: "Multi-jump circuit", level: "Let øvet", duration: "8–12 min", purpose: "Træn spændstighed, kontrol og elastisk kraft i underbenene med korte hopserier.", steps: ["Pogo-hop · 2 x 20", "Skater-hop · 2 x 8 pr. side", "Split squat-hop · 2 x 6 pr. side", "Rolig gang · 60 sek pause mellem runder"] },
  { name: "Medicinbold for løbere", level: "Let øvet", duration: "10–15 min", purpose: "Udvikl eksplosiv kraft og koordination, der kan understøtte et effektivt løbesteg.", steps: ["Rotationskast mod væg · 3 x 6 pr. side", "Brystkast · 3 x 8", "Overhead-kast bagud · 3 x 6", "Rolig pause · 45–60 sek mellem sæt"] },
  { name: "Avanceret plyometri", level: "Øvet", duration: "12–18 min", purpose: "Arbejd med afsæt, stivhed og kraft, når du allerede tåler regelmæssig hoppetræning.", steps: ["Enbens-pogo · 2 x 10 pr. ben", "Bounds · 3 x 20 m", "Boks-hop · 3 x 5", "Stigningsløb · 4 x 60 m"] },
  { name: "Ankelstyrke", level: "Alle niveauer", duration: "8–10 min", purpose: "Styrk fødder, ankler og lægge for bedre stabilitet og robusthed i løbetræningen.", steps: ["Læghævninger med strakt knæ · 2 x 12", "Læghævninger med bøjet knæ · 2 x 12", "Tibialis-løft · 2 x 15", "Enbensbalance · 2 x 30 sek pr. ben"] },
  { name: "Agility-ladder plyometri", level: "Let øvet", duration: "10–14 min", purpose: "Øv hurtige fødder, timing og retningsskift med lav volumen og høj kvalitet.", steps: ["One-in · 2 gennemløb", "Two-in · 2 gennemløb", "In-in-out-out · 2 gennemløb", "Sideways quick steps · 2 gennemløb pr. side"] },
] as const;

export default function VdotCalculator() {
  const [activePage, setActivePage] = useState<PageKey>("home");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [energyDistance, setEnergyDistance] = useState(21);
  const [energyHours, setEnergyHours] = useState(2);
  const [energyMinutes, setEnergyMinutes] = useState(0);
  const [energyWeight, setEnergyWeight] = useState(68);
  const [energyCarbs, setEnergyCarbs] = useState(0.75);
  const [energyTemperature, setEnergyTemperature] = useState(15);
  const [energyCalculated, setEnergyCalculated] = useState(false);
  const [distance, setDistance] = useState(5);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(22);
  const [seconds, setSeconds] = useState(30);
  const [calculated, setCalculated] = useState(true);
  const [showMethod, setShowMethod] = useState(false);
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState<SavedCalculation[]>([]);
  const [loadActivity, setLoadActivity] = useState("Løb");
  const [loadDuration, setLoadDuration] = useState(45);
  const [loadDistance, setLoadDistance] = useState(7);
  const [loadRpe, setLoadRpe] = useState(5);
  const [load7Distance, setLoad7Distance] = useState(25);
  const [load30Distance, setLoad30Distance] = useState(90);
  const [loadCalculated, setLoadCalculated] = useState(true);
  const [recoveryDuration, setRecoveryDuration] = useState(50);
  const [recoveryIntensityKey, setRecoveryIntensityKey] = useState<keyof typeof recoveryIntensity>("easy");
  const [recoveryWeeklyDistance, setRecoveryWeeklyDistance] = useState(35);
  const [recoverySleep, setRecoverySleep] = useState(7.5);
  const [recoverySoreness, setRecoverySoreness] = useState(3);
  const [recoveryHeat, setRecoveryHeat] = useState("cool");
  const [recoveryElevation, setRecoveryElevation] = useState(0);
  const [recoveryAge, setRecoveryAge] = useState(40);
  const [recoveryNextSession, setRecoveryNextSession] = useState("easy");
  const [recoveryCalculated, setRecoveryCalculated] = useState(true);
  const [strategyDistance, setStrategyDistance] = useState(10);
  const [strategyHours, setStrategyHours] = useState(0);
  const [strategyMinutes, setStrategyMinutes] = useState(50);
  const [strategySeconds, setStrategySeconds] = useState(0);
  const [strategyProfile, setStrategyProfile] = useState<keyof typeof raceStrategyProfiles>("negative");
  const [strategyTerrain, setStrategyTerrain] = useState("flat");
  const [strategyTemperature, setStrategyTemperature] = useState("mild");
  const [strategyCalculated, setStrategyCalculated] = useState(true);
  const [vo2Method, setVo2Method] = useState("cooper");
  const [vo2Distance, setVo2Distance] = useState(2400);
  const [vo2MaxHeartRate, setVo2MaxHeartRate] = useState(190);
  const [vo2RestingHeartRate, setVo2RestingHeartRate] = useState(60);
  const [vo2Sex, setVo2Sex] = useState("men");
  const [vo2Age, setVo2Age] = useState(40);
  const [vo2Calculated, setVo2Calculated] = useState(true);
  const [checklistSleep, setChecklistSleep] = useState(7);
  const [checklistStress, setChecklistStress] = useState(3);
  const [checklistSoreness, setChecklistSoreness] = useState(2);
  const [checklistMotivation, setChecklistMotivation] = useState(8);
  const [checklistSymptoms, setChecklistSymptoms] = useState("no");
  const [checklistCalculated, setChecklistCalculated] = useState(true);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});


  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setSaved(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
      } catch {
        setSaved([]);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);


  const totalMinutes = hours * 60 + minutes + seconds / 60;
  const valid = distance > 0 && totalMinutes > 0;
  const vdot = useMemo(() => valid ? vdotFor(distance, totalMinutes) : 0, [distance, totalMinutes, valid]);
  const predictions = useMemo(() => valid ? races.map((race) => ({ ...race, time: predictedMinutes(race.km, vdot) })) : [], [valid, vdot]);
  const zones = useMemo(() => valid ? zoneConfig.map((zone) => ({
    ...zone,
    fast: 1000 / velocityForOxygen(vdot * zone.high),
    slow: 1000 / velocityForOxygen(vdot * zone.low),
  })) : [], [valid, vdot]);


  const explanation = getVdotExplanation(vdot);
  const selectedRace = races.find((race) => race.km === distance);
  const energyDuration = energyHours + energyMinutes / 60;
  const energyValid = energyDistance > 0 && energyDuration > 0 && energyWeight > 0;
  const energyCalories = energyDistance * energyWeight;
  const energyCarbGrams = energyDuration * energyCarbs * 60;
  const energyGels = Math.ceil(energyCarbGrams / 40);
  const energyWater = Math.round((400 + Math.min(400, Math.max(0, energyTemperature - 10) * 20)) * energyDuration);
  const energySalt = Math.round((300 + Math.min(300, Math.max(0, energyTemperature - 10) * 15)) * energyDuration);
  const energyPace = energyDistance / energyDuration;
  const energyGelSchedule = Array.from({ length: energyGels }, (_, index) => {
    const minutes = Math.min(energyDuration * 60 - 10, 35 + index * (energyDuration * 60 - 45) / Math.max(1, energyGels - 1));
    return { minutes: Math.max(20, minutes), km: energyPace * Math.max(20, minutes) / 60 };
  });
  const energySaltSchedule = Array.from({ length: Math.max(1, Math.ceil(energyDuration)) }, (_, index) => {
    const minutes = Math.min(energyDuration * 60 - 10, 45 + index * 60);
    return { minutes: Math.max(30, minutes), km: energyPace * Math.max(30, minutes) / 60 };
  });
  const activePageLabel = navigationSections.flatMap((section) => section.pages).find((page) => page.key === activePage)?.label ?? "VDOT";
  const trainingLoad = Math.round(loadDuration * loadRpe);
  const loadLevel = getLoadLevel(trainingLoad);
  const averageWeeklyDistance = load30Distance / (30 / 7);
  const volumeRatio = averageWeeklyDistance > 0 ? load7Distance / averageWeeklyDistance : 0;
  const volumeLevel = volumeRatio > 1.3 ? { label: "Stor stigning", color: "text-rose-300", advice: "Overvej at holde igen eller gentage mængden en uge mere, før du øger igen." } : volumeRatio > 1.1 ? { label: "Moderat stigning", color: "text-amber-300", advice: "En mindre stigning kan være fin, hvis du føler dig frisk og holder de hårde pas under kontrol." } : { label: "Stabil mængde", color: "text-emerald-300", advice: "Din aktuelle uge ligger tæt på dit normale niveau." };
  const recoveryIntensityData = recoveryIntensity[recoveryIntensityKey];
  const recoveryHeatFactor = recoveryHeat === "mild" ? 0.04 : recoveryHeat === "warm" ? 0.12 : recoveryHeat === "hot" ? 0.22 : recoveryHeat === "extreme" ? 0.32 : 0;
  const recoveryWeeklyFactor = Math.min(0.32, Math.max(-0.06, (recoveryWeeklyDistance - 25) / 150));
  const recoverySleepPenalty = Math.min(0.34, Math.max(0, (7.5 - recoverySleep) * 0.11));
  const recoverySorenessPenalty = Math.min(0.48, Math.max(0, (recoverySoreness - 3) * 0.075));
  const recoveryAgeFactor = recoveryAge >= 60 ? 0.22 : recoveryAge >= 50 ? 0.16 : recoveryAge >= 40 ? 0.1 : recoveryAge >= 30 ? 0.04 : 0;
  const recoveryElevationFactor = Math.min(0.3, recoveryElevation / 3000 * 0.18);
  const recoveryHours = Math.max(4, Math.min(120, (recoveryIntensityData.base + recoveryDuration * 0.22 * recoveryIntensityData.factor) * (1 + recoveryWeeklyFactor + recoverySleepPenalty + recoverySorenessPenalty + recoveryHeatFactor + recoveryElevationFactor + recoveryAgeFactor)));
  const recoveryEasyHours = Math.max(3, Math.min(72, recoveryHours * (recoveryNextSession === "rest" ? 0.45 : 0.58)));
  const recoveryBufferHours = Math.max(0, Math.min(72, recoveryHours - recoveryEasyHours));
  const strategyGoalMinutes = strategyHours * 60 + strategyMinutes + strategySeconds / 60;
  const strategyTerrainFactor = strategyTerrain === "rolling" ? 1.025 : strategyTerrain === "hilly" ? 1.05 : 1;
  const strategyTemperatureFactor = strategyTemperature === "warm" ? 1.03 : strategyTemperature === "hot" ? 1.06 : 1;
  const strategyAdjustedMinutes = strategyGoalMinutes * strategyTerrainFactor * strategyTemperatureFactor;
  const strategyProfileData = raceStrategyProfiles[strategyProfile];
  const strategySplitTotal = strategyProfileData.splits.reduce((sum, split) => sum + split, 0);
  const strategySplits = strategyProfileData.splits.map((split, index) => ({
    number: index + 1,
    pace: strategyAdjustedMinutes / strategyDistance * split * 5 / strategySplitTotal,
  }));
  const vo2max = vo2Method === "cooper" ? vo2FromCooper(vo2Distance) : vo2FromHeartRate(vo2MaxHeartRate, vo2RestingHeartRate);
  const vo2Norm = vo2Norms.find((norm) => (vo2Age < 30 ? norm.age === "20–29" : vo2Age < 40 ? norm.age === "30–39" : vo2Age < 50 ? norm.age === "40–49" : vo2Age < 60 ? norm.age === "50–59" : vo2Age < 70 ? norm.age === "60–69" : norm.age === "70+")) ?? vo2Norms[2];
  const vo2Thresholds = vo2Sex === "men" ? vo2Norm.men : vo2Norm.women;
  const vo2Category = vo2max < vo2Thresholds[0] ? "Under gennemsnittet" : vo2max < vo2Thresholds[1] ? "Gennemsnitlig" : vo2max < vo2Thresholds[2] ? "God" : vo2max < vo2Thresholds[3] ? "Meget god" : "Fremragende";
  const checklistScore = Math.max(0, Math.min(100, 25 + Math.min(25, checklistSleep / 8 * 25) + (10 - checklistStress) * 2.5 + (10 - checklistSoreness) * 2.5 + checklistMotivation * 2.5 - (checklistSymptoms === "yes" ? 35 : 0)));
  const checklistStatus = checklistSymptoms === "yes" || checklistScore < 45 ? { label: "Rød: Overvej at springe over", color: "text-rose-300", panel: "border-rose-400/30 bg-rose-400/10", advice: "Sygdomssymptomer eller en meget lav parathed er et signal om at prioritere helbred og restitution. En konkurrence kan vente." } : checklistScore < 70 ? { label: "Gul: Gennemfør med omtanke", color: "text-amber-300", panel: "border-amber-400/30 bg-amber-400/10", advice: "Du kan muligvis stille til start, men overvej at sænke målet, varme grundigt op og være klar til at stoppe." } : { label: "Grøn: Du ser klar ud", color: "text-emerald-300", panel: "border-emerald-400/30 bg-emerald-400/10", advice: "Dine svar peger på en god parathed. Hold fast i en realistisk plan og nyd løbsoplevelsen." };
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const checklistTotal = raceChecklistGroups.reduce((total, group) => total + group.items.length, 0);
  const energyWaterSchedule = Array.from({ length: Math.max(1, Math.ceil(energyDuration * 60 / 20)) }, (_, index) => {
    const minutes = Math.min(energyDuration * 60 - 5, 20 + index * 20);
    return { minutes: Math.max(10, minutes), km: energyPace * Math.max(10, minutes) / 60 };
  });


  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const getPageExportMeta = () => {
    switch (activePage) {
      case "home":
        return {
          title: "Startside",
          subtitle: "Overblik over HLM-appens værktøjer",
          summary: "HLM App · Oversigt over løbefunktioner",
          primary: "Startside",
          secondary: "Vælg den funktion, du vil bruge",
        };
      case "vo2max":
        return {
          title: "VO₂max",
          subtitle: `${vo2Method === "cooper" ? "Cooper-test" : "Pulsestimat"}`,
          summary: `VO₂max ${Number.isFinite(vo2max) ? vo2max.toFixed(1) : "–"} ml/kg/min · ${vo2Method === "cooper" ? "Cooper-test" : "Pulsestimat"}`,
          primary: Number.isFinite(vo2max) ? `${vo2max.toFixed(1)} ml/kg/min` : "–",
          secondary: vo2Category,
        };
      case "training-load":
        return {
          title: "Træningsbelastning",
          subtitle: `${loadActivity} · ${loadDuration} min · RPE ${loadRpe}/10`,
          summary: `Træningsbelastning ${trainingLoad} point · ${loadLevel.label}`,
          primary: `${trainingLoad} point`,
          secondary: loadLevel.label,
        };
      case "recovery":
        return {
          title: "Restitution",
          subtitle: `${recoveryIntensityData.label} · ${recoverySleep} t søvn`,
          summary: `Restitution ${Math.round(recoveryHours)} timer · ${recoveryIntensityData.label}`,
          primary: `${Math.round(recoveryHours)} timer`,
          secondary: recoveryAdvice(recoveryHours),
        };
      case "race-strategy":
        return {
          title: "Løbsstrategi",
          subtitle: `${strategyProfileData.label} · ${strategyDistance} km`,
          summary: `Løbsstrategi ${strategyProfileData.label} · ${strategyCalculated ? formatTime(strategyAdjustedMinutes) : "–"}`,
          primary: strategyCalculated ? formatTime(strategyAdjustedMinutes) : "–",
          secondary: strategyProfileData.label,
        };
      case "energy-strategy":
        return {
          title: "Energistrategi",
          subtitle: `${energyDistance} km · ${energyHours}t ${energyMinutes}m`,
          summary: `Energistrategi ${Math.round(energyCarbGrams)} g carbs · ${energyWater} ml væske`,
          primary: `${Math.round(energyCarbGrams)} g kulhydrat`,
          secondary: `${energyWater} ml væske · ${energySalt} mg salt`,
        };
      case "checklists":
        return {
          title: "Løbscheckliste",
          subtitle: `${Math.round(checklistScore)}/100 · ${checklistStatus.label}`,
          summary: `Løbscheckliste ${Math.round(checklistScore)}/100 · søvn ${checklistSleep}h · stress ${checklistStress}/10 · ømhed ${checklistSoreness}/10 · motivation ${checklistMotivation}/10`,
          primary: `${Math.round(checklistScore)}/100`,
          secondary: `${checklistStatus.label} · søvn ${checklistSleep}h · stress ${checklistStress}/10 · ømhed ${checklistSoreness}/10`,
        };
      case "exercises":
        return {
          title: "Øvelsesbibliotek",
          subtitle: `${runningDrills.length} øvelser og workouts`,
          summary: `Øvelsesbibliotek · ${runningDrills.length} drills`,
          primary: `${runningDrills.length} drills`,
          secondary: "Teknik, styrke og opvarmning",
        };
      case "vdot":
      default:
        return {
          title: "VDOT",
          subtitle: `${selectedRace?.name ?? "Løbsdistance"} · ${valid ? formatTime(totalMinutes) : "–"}`,
          summary: `VDOT ${calculated && valid ? vdot.toFixed(1) : "–"} · ${selectedRace?.name ?? "Løbsdistance"}`,
          primary: calculated && valid ? `${vdot.toFixed(1)} VDOT` : "–",
          secondary: valid ? `${formatPace(totalMinutes / distance)} min/km` : "Udfyld tid",
        };
    }
  };

  const getExportSummary = () => getPageExportMeta().summary;


  const reset = () => {
    setDistance(5);
    setHours(0);
    setMinutes(22);
    setSeconds(30);
    setCalculated(false);
  };

  const handleNumber = (value: string, setter: React.Dispatch<React.SetStateAction<number>>, max: number) => {
    const parsed = Number(value);
    setter(Math.min(max, Math.max(0, Number.isFinite(parsed) ? parsed : 0)));
    setCalculated(false);
  };

  const persistSaved = (items: SavedCalculation[]) => {
    setSaved(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const saveCalculation = () => {
    if (!calculated || !valid || !selectedRace) return;
    const item: SavedCalculation = {
      id: Date.now(),
      savedAt: new Date().toISOString(),
      distanceKm: distance,
      distanceName: selectedRace.name,
      hours,
      minutes,
      seconds,
      vdot: Number(vdot.toFixed(1)),
    };
    persistSaved([item, ...saved].slice(0, 20));
    flash("Beregningen er gemt på denne enhed");
  };

  const saveCurrentPage = () => {
    if (activePage === "vdot") {
      saveCalculation();
      return;
    }

    const currentPageSnapshot = {
      page: activePage,
      label: activePageLabel,
      savedAt: new Date().toISOString(),
      summary: getExportSummary(),
      meta: getPageExportMeta(),
    };

    const allSavedPages = JSON.parse(localStorage.getItem("hlm-page-snapshots") || "{}");
    allSavedPages[activePage] = currentPageSnapshot;
    localStorage.setItem("hlm-page-snapshots", JSON.stringify(allSavedPages));
    flash(`${activePageLabel} er gemt på denne enhed`);
  };

  const loadCalculation = (item: SavedCalculation) => {
    setDistance(item.distanceKm);
    setHours(item.hours);
    setMinutes(item.minutes);
    setSeconds(item.seconds);
    setCalculated(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    flash("Den gemte beregning er indlæst");
  };

  const deleteCalculation = (id: number) => {
    persistSaved(saved.filter((item) => item.id !== id));
    flash("Den gemte beregning er slettet");
  };

  const downloadImage = () => {
    const meta = getPageExportMeta();

    if (activePage === "vdot") {
      if (!calculated || !valid || !selectedRace) return;
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = 1080 * scale;
      canvas.height = 1350 * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.scale(scale, scale);

      const box = (x: number, y: number, w: number, h: number, r: number, fill: string) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
      };

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, 1080, 1350);
      const gradient = ctx.createLinearGradient(60, 60, 1020, 1290);
      gradient.addColorStop(0, "#083344");
      gradient.addColorStop(1, "#0f172a");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(60, 60, 960, 1230, 38);
      ctx.fill();
      ctx.fillStyle = "#67e8f9";
      ctx.font = "700 24px Arial";
      ctx.fillText("HLM APP - Din hjælp til at løbe bedre", 110, 130);
      ctx.fillStyle = "#ffffff";
      ctx.font = "800 50px Arial";
      ctx.fillText("Min VDOT-beregning", 110, 200);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "25px Arial";
      ctx.fillText(`${selectedRace.name}  ·  ${formatTime(totalMinutes)}  ·  ${formatPace(totalMinutes / distance)} min/km`, 110, 250);
      box(110, 300, 860, 245, 28, "#0e7490");
      ctx.fillStyle = "#cffafe";
      ctx.font = "700 22px Arial";
      ctx.fillText("BEREGNET LØBEFORM", 155, 360);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 110px Arial";
      ctx.fillText(vdot.toFixed(1), 150, 485);
      ctx.font = "700 32px Arial";
      ctx.fillText("VDOT", 465, 475);
      ctx.font = "700 30px Arial";
      ctx.fillText("Vejledende træningstempoer", 110, 620);
      zones.forEach((zone, index) => {
        const y = 675 + index * 92;
        box(110, y - 40, 860, 70, 17, "#1e293b");
        ctx.fillStyle = "#67e8f9";
        ctx.font = "700 23px Arial";
        ctx.fillText(`${zone.key}  ${zone.name}`, 140, y + 3);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "right";
        ctx.fillText(`${formatPace(zone.slow)}–${formatPace(zone.fast)} min/km`, 935, y + 3);
        ctx.textAlign = "left";
      });

      ctx.fillStyle = "#64748b";
      ctx.font = "19px Arial";
      ctx.fillText(`${new Date().toLocaleDateString("da-DK")}  ·  Vejledende beregning`, 110, 1235);
      const link = document.createElement("a");
      link.download = `vdot-${selectedRace.name.toLowerCase().replaceAll(" ", "-")}-${vdot.toFixed(1)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      flash("Resultatet er downloadet som PNG");
      return;
    }

    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = 1080 * scale;
    canvas.height = 960 * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, 1080, 960);
    const gradient = ctx.createLinearGradient(60, 60, 1020, 900);
    gradient.addColorStop(0, "#083344");
    gradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(60, 60, 960, 840, 32);
    ctx.fill();

    ctx.fillStyle = "#67e8f9";
    ctx.font = "700 24px Arial";
    ctx.fillText("HLM APP - Din hjælp til at løbe bedre", 110, 125);
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 46px Arial";
    ctx.fillText(activePageLabel, 110, 190);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "24px Arial";
    ctx.fillText(meta.summary, 110, 250);

    const cards = [
      { label: "Primær værdi", value: meta.primary },
      { label: "Detaljer", value: meta.secondary },
    ];

    cards.forEach((card, index) => {
      const x = 110 + index * 350;
      const y = 320;
      ctx.fillStyle = "rgba(15, 23, 42, 0.7)";
      ctx.beginPath();
      ctx.roundRect(x, y, 300, 130, 22);
      ctx.fill();
      ctx.fillStyle = "#94a3b8";
      ctx.font = "18px Arial";
      ctx.fillText(card.label, x + 22, y + 40);
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 30px Arial";
      const value = card.value || "–";
      const maxTextWidth = 250;
      const clippedValue = value.length > 22 ? `${value.slice(0, 22)}…` : value;
      ctx.fillText(clippedValue, x + 22, y + 90, maxTextWidth);
    });

    const detailLines = (() => {
      switch (activePage) {
        case "vo2max":
          return [`Metode: ${vo2Method === "cooper" ? "Cooper-test" : "Pulsestimat"}`, `Alder: ${vo2Age}`, `Køn: ${vo2Sex === "men" ? "Mand" : "Kvinde"}`];
        case "training-load":
          return [`Aktivitet: ${loadActivity}`, `Varighed: ${loadDuration} min`, `RPE: ${loadRpe}/10`, `Mængde: ${load7Distance} km / 7d · ${load30Distance} km / 30d`];
        case "recovery":
          return [`Intensitet: ${recoveryIntensityData.label}`, `Søvn: ${recoverySleep} timer`, `Ømhed: ${recoverySoreness}/10`, `Næste pas: ${recoveryNextSession}`];
        case "race-strategy":
          return [`Dist.: ${strategyDistance} km`, `Mål: ${formatTime(strategyGoalMinutes)}`, `Terræn: ${strategyTerrain}`, `Temp.: ${strategyTemperature}`];
        case "energy-strategy":
          return [`Distance: ${energyDistance} km`, `Tid: ${formatTime(energyDuration * 60)}`, `Vægt: ${energyWeight} kg`, `Kulhydrat: ${Math.round(energyCarbGrams)} g`];
        case "checklists":
          return [`Søvn: ${checklistSleep} h`, `Stress: ${checklistStress}/10`, `Ømhed: ${checklistSoreness}/10`, `Motivation: ${checklistMotivation}/10`];
        case "exercises":
          return [`Drills: ${runningDrills.length}`, `Teknik: ${runningDrills[0]?.name ?? "Løbedrill"}`, `Workout: ${runningWorkouts[0]?.name ?? "Opvarmning"}`];
        default:
          return [`Distance: ${selectedRace?.name ?? "–"}`, `Tid: ${valid ? formatTime(totalMinutes) : "–"}`, `Pace: ${valid ? formatPace(totalMinutes / distance) : "–"}`];
      }
    })();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "18px Arial";
    detailLines.forEach((line, index) => {
      ctx.fillText(line, 110, 500 + index * 32);
    });

    ctx.fillStyle = "#64748b";
    ctx.font = "19px Arial";
    ctx.fillText(`${new Date().toLocaleDateString("da-DK")}  ·  ${meta.title}`, 110, 760);

    const link = document.createElement("a");
    link.download = `${activePageLabel.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    flash(`Denne ${meta.title.toLowerCase()} er downloadet som PNG`);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100 selection:bg-cyan-300 selection:text-slate-950 print:bg-white print:text-black">
      <style>{`@media print { @page { margin: 10mm; size: A4 portrait; } .no-print { display: none !important; } .print-card { border: 1px solid #cbd5e1 !important; background: white !important; color: black !important; box-shadow: none !important; break-inside: avoid; } .print-muted { color: #475569 !important; } main { background: white !important; } h1, h2, h3, p, span, div, button, li { color: #111827 !important; } .print-reading { font-size: 12pt !important; line-height: 1.5 !important; } .print-small { font-size: 10pt !important; line-height: 1.45 !important; } .print-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 12px !important; } }`}</style>
      {notice && (
        <div role="status" className="no-print fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-emerald-300/20 bg-emerald-950/95 px-4 py-2.5 text-sm font-medium text-emerald-200 shadow-2xl backdrop-blur max-sm:max-w-[calc(100vw-1.5rem)] max-sm:truncate">
          <CheckCircle2 size={17} /> {notice}
        </div>
      )}
      <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pb-12 sm:pt-10">
        <header className="mb-6 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 print:border-slate-300 print:bg-white print:text-slate-700 sm:text-sm">
              <Activity size={16} /> HLM APP - Din hjælp til at løbe bedre
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{activePage === "vdot" ? "VDOT løbeberegner" : activePageLabel}</h1>
            <p className="print-muted mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Beregn din aktuelle løbeform, forventede konkurrencetider og vejledende træningstempoer.
            </p>
          </div>
          <div className="no-print flex w-full justify-end sm:w-auto">
            <button onClick={() => { document.title = `${activePageLabel} · HLM App`; window.print(); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20 sm:flex-none"><Printer size={17} /><span>{activePage === "vdot" ? "Udskriv VDOT" : `Udskriv ${activePageLabel}`}</span></button>
          </div>
        </header>

        <nav aria-label="Hovednavigation" className="no-print mb-6 grid gap-2 rounded-2xl border border-white/10 bg-white/[0.045] p-2 sm:mb-8 sm:grid-cols-2 lg:grid-cols-5">
          {navigationSections.map((section) => {
            const SectionIcon = section.icon;
            const isActive = section.pages.some((page) => page.key === activePage);

            return (
              <div key={section.label} className="rounded-xl border border-white/10 bg-slate-950/40 p-1.5">
                <div className={`flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${isActive ? "bg-cyan-400 text-slate-950" : "text-slate-400"}`}>
                  <SectionIcon size={16} />
                  <span>{section.label}</span>
                </div>
                <div className="mt-2 space-y-1">
                  {section.pages.map((page) => (
                    <button
                      key={page.key}
                      onClick={() => setActivePage(page.key)}
                      aria-current={activePage === page.key ? "page" : undefined}
                      className={`flex min-h-10 w-full items-center rounded-lg px-3 text-left text-sm transition ${activePage === page.key ? "bg-cyan-400/10 text-cyan-300" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                    >
                      {page.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <section className="mb-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5 sm:mb-8 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-8">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Hvilket resultat får jeg?</p><p className="mt-2 text-lg font-bold text-white">{pageExplanations[activePage].result}</p></div>
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Hvad kan jeg bruge det til?</p><p className="mt-2 text-sm leading-6 text-slate-300">{pageExplanations[activePage].benefit}</p></div>
          </div>
        </section>

        {activePage === "home" && (
          <section className="space-y-6">
            <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-slate-950 to-slate-900 p-5 shadow-2xl sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Start her</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Få hurtigt et overblik over din træning</h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Her kan du se, hvad appen kan hjælpe dig med – fra at vurdere din løbeform til at planlægge din energi, restitution og løbsstrategi.
                Hvis du er lidt i tvivl om, hvad du skal gøre, så start med den side, der passer til det spørgsmål, du har lige nu.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={() => setActivePage("vdot")} className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">Start med VDOT</button>
                <button onClick={() => setActivePage("training-load")} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">Se træningsbelastning</button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                { key: "vdot", title: "VDOT", text: "Find din aktuelle løbeform og få vejledende træningstempoer til alle zoner.", icon: Calculator },
                { key: "vo2max", title: "VO₂max", text: "Se din aerobe kapacitet ud fra Cooper-test eller pulsestimat.", icon: Gauge },
                { key: "training-load", title: "Træningsbelastning", text: "Vurder, om du træner for hårdt eller for lidt, og få bedre kontrol over belastningen.", icon: Activity },
                { key: "recovery", title: "Restitution", text: "Find ud af, hvor lang tid du bør vente, før dit næste hårde løbe- eller kvalitetspas.", icon: Clock3 },
                { key: "race-strategy", title: "Løbsstrategi", text: "Planlæg pacing, tempo og en realistisk rute gennem løbet.", icon: Trophy },
                { key: "energy-strategy", title: "Energistrategi", text: "Få et praktisk bud på væske, salt og kulhydrater under længere løb.", icon: Sparkles },
              ].map(({ key, title, text, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActivePage(key as PageKey)}
                  className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-left transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{text}</p>
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 sm:p-6">
              <h3 className="text-xl font-bold">Sådan vælger du, hvad du skal bruge</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="font-semibold text-cyan-300">Hvis du vil måle din form</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Gå til VDOT eller VO₂max.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="font-semibold text-cyan-300">Hvis du er usikker på træningen</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Start med træningsbelastning eller restitution.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <p className="font-semibold text-cyan-300">Hvis du skal til løb</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">Vælg løbsstrategi, energistrategi eller checklister.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activePage === "vo2max" && <>
          <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr] lg:gap-6">
            <div className="no-print rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:p-7">
              <div className="mb-5 flex items-start gap-3"><div className="shrink-0 rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><Gauge size={22} /></div><div><h2 className="text-lg font-semibold sm:text-xl">Din VO₂max-test</h2><p className="mt-1 text-sm leading-5 text-slate-400">Brug en maksimal 12-minutters test for det bedste løbeestimat.</p></div></div>
              <label className="mb-2 block text-sm font-medium" htmlFor="vo2-method">Beregningsmetode</label><select id="vo2-method" value={vo2Method} onChange={(event) => { setVo2Method(event.target.value); setVo2Calculated(false); }} className="mb-4 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"><option value="cooper">Cooper-test: distance på 12 minutter</option><option value="heart-rate">Pulsestimat</option></select>
              {vo2Method === "cooper" ? <label className="block text-sm text-slate-400" htmlFor="vo2-distance">Distance på 12 minutter (meter)<input id="vo2-distance" type="number" min="500" value={vo2Distance} onChange={(event) => { setVo2Distance(Math.max(0, Number(event.target.value) || 0)); setVo2Calculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /><span className="mt-1 block text-xs text-slate-500">Løb så langt som muligt på en flad rute eller bane.</span></label> : <div className="grid grid-cols-2 gap-3"><label className="text-sm text-slate-400" htmlFor="vo2-max-heart-rate">Maksimal puls<input id="vo2-max-heart-rate" type="number" min="100" value={vo2MaxHeartRate} onChange={(event) => { setVo2MaxHeartRate(Math.max(1, Number(event.target.value) || 0)); setVo2Calculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label><label className="text-sm text-slate-400" htmlFor="vo2-resting-heart-rate">Hvilepuls<input id="vo2-resting-heart-rate" type="number" min="30" value={vo2RestingHeartRate} onChange={(event) => { setVo2RestingHeartRate(Math.max(1, Number(event.target.value) || 0)); setVo2Calculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label></div>}
              <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm text-slate-400" htmlFor="vo2-sex">Køn<select id="vo2-sex" value={vo2Sex} onChange={(event) => { setVo2Sex(event.target.value); setVo2Calculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"><option value="men">Mand</option><option value="women">Kvinde</option></select></label><label className="text-sm text-slate-400" htmlFor="vo2-age">Alder<input id="vo2-age" type="number" min="18" value={vo2Age} onChange={(event) => { setVo2Age(Math.max(18, Number(event.target.value) || 0)); setVo2Calculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label></div>
              <button disabled={(vo2Method === "cooper" ? vo2Distance < 500 : vo2MaxHeartRate <= vo2RestingHeartRate)} onClick={() => setVo2Calculated(true)} className="mt-6 min-h-12 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40">Beregn VO₂max</button>
            </div>
            <div className="print-card rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-blue-500/5 p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300 sm:text-sm">Din estimerede score</p><div className="mt-3 flex items-end gap-2"><span className="text-6xl font-black tabular-nums sm:text-7xl">{vo2Calculated && Number.isFinite(vo2max) ? vo2max.toFixed(1) : "–"}</span><span className="mb-2 text-lg text-slate-400">ml/kg/min</span></div>{vo2Calculated && <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-black/20 p-4"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 shrink-0 text-cyan-300" size={20} /><div><h2 className="font-semibold text-cyan-200">{vo2Category}</h2><p className="mt-1 text-sm leading-6 text-slate-300">VO₂max beskriver din maksimale evne til at optage og udnytte ilt under hårdt arbejde. Brug især udviklingen i din egen score til at følge formen.</p></div></div></div>}<div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-slate-400">Aldersgruppe</p><p className="mt-1 text-lg font-semibold">{vo2Norm.age}</p></div><div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-slate-400">Metode</p><p className="mt-1 text-lg font-semibold">{vo2Method === "cooper" ? "Cooper-test" : "Pulsestimat"}</p></div></div></div>
          </section>
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 sm:mt-8 sm:p-7"><h2 className="text-xl font-bold sm:text-2xl">VO₂max skema for løbere</h2><p className="mt-2 text-sm leading-6 text-slate-400">Vælg køn og alder ovenfor for at se, hvordan din score ligger i forhold til vejledende niveauer. Tallene er omtrentlige referenceværdier, ikke en diagnose.</p><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-cyan-400/20 text-xs uppercase tracking-wider text-cyan-300"><th className="px-3 py-3">Alder</th><th className="px-3 py-3">Under gennemsnit</th><th className="px-3 py-3">Gennemsnit</th><th className="px-3 py-3">God</th><th className="px-3 py-3">Meget god</th><th className="px-3 py-3">Fremragende</th></tr></thead><tbody>{vo2Norms.map((norm) => { const values = vo2Sex === "men" ? norm.men : norm.women; return <tr key={norm.age} className={`border-b border-white/10 ${norm.age === vo2Norm.age ? "bg-cyan-400/10" : ""}`}><td className="px-3 py-3 font-semibold">{norm.age}</td><td className="px-3 py-3">&lt; {values[0]}</td><td className="px-3 py-3">{values[0]}–{values[1] - 1}</td><td className="px-3 py-3">{values[1]}–{values[2] - 1}</td><td className="px-3 py-3">{values[2]}–{values[3] - 1}</td><td className="px-3 py-3">{values[3]}+</td></tr>; })}</tbody></table></div><p className="mt-4 text-xs leading-5 text-slate-500">Referenceværdierne er tilpasset almindelige voksne løbere. Sammenlign primært med dig selv over tid, og gentag Cooper-testen under samme forhold.</p></section>
        </>}

        {activePage === "vdot" && <>
        <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr] lg:gap-6">
          <div className="no-print rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start gap-3">
              <div className="shrink-0 rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><Calculator size={22} /></div>
              <div><h2 className="text-lg font-semibold sm:text-xl">Din løbspræstation</h2><p className="mt-1 text-sm leading-5 text-slate-400">Brug helst et nyligt løb tæt på dit bedste.</p></div>
            </div>
            <label className="mb-2 block text-sm font-medium" htmlFor="distance">Distance</label>
            <select id="distance" value={distance} onChange={(event) => { setDistance(Number(event.target.value)); setCalculated(false); }} className="mb-5 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20">
              {races.map((race) => <option key={race.name} value={race.km}>{race.name}</option>)}
            </select>
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Sluttid</legend>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  ["Timer", hours, setHours, 12],
                  ["Minutter", minutes, setMinutes, 59],
                  ["Sekunder", seconds, setSeconds, 59],
                ].map(([label, value, setter, max]) => (
                  <label key={String(label)} className="text-xs text-slate-400">{String(label)}
                    <input inputMode="numeric" min="0" max={Number(max)} type="number" value={Number(value)} onChange={(event) => handleNumber(event.target.value, setter as React.Dispatch<React.SetStateAction<number>>, Number(max))} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-2 py-3 text-center text-lg text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
                  </label>
                ))}
              </div>
            </fieldset>
            {!valid && <p className="mt-3 rounded-xl bg-rose-400/10 p-3 text-sm text-rose-300">Indtast en sluttid større end nul.</p>}
            {!calculated && valid && <p className="mt-3 text-sm text-cyan-300">Tryk på Beregn for at opdatere resultaterne.</p>}
            <div className="mt-6 flex gap-3">
              <button disabled={!valid} onClick={() => setCalculated(true)} className="min-h-12 flex-1 rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40">Beregn resultat</button>
              <button onClick={reset} aria-label="Nulstil" className="grid min-h-12 min-w-12 place-items-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"><RotateCcw size={19} /></button>
            </div>
          </div>

          <div className="print-card rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-blue-500/5 p-5 sm:p-8">
            <div className="flex h-full flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300 print:text-slate-600 sm:text-sm">Din beregnede score</p>
                <div className="mt-3 flex items-end gap-2"><span className="text-6xl font-black tabular-nums sm:text-7xl">{calculated && valid ? vdot.toFixed(1) : "–"}</span><span className="mb-1 text-lg text-slate-400 print:text-slate-600">VDOT</span></div>
                {calculated && valid && <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-black/20 p-4 print:border-slate-200 print:bg-slate-50"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 shrink-0 text-cyan-300 print:text-slate-700" size={20} /><div><h2 className="font-semibold">{explanation.title}</h2><p className="print-muted mt-1 text-sm leading-6 text-slate-300">{explanation.text}</p></div></div></div>}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-2xl bg-black/20 p-3 print:bg-slate-100 sm:p-4"><Clock3 className="mb-2 text-cyan-300 print:text-slate-700" size={20} /><p className="print-muted text-xs text-slate-400">Dit pace</p><p className="mt-1 text-lg font-semibold sm:text-xl">{valid ? formatPace(totalMinutes / distance) : "–"}</p><p className="text-xs text-slate-500">min/km</p></div>
                <div className="rounded-2xl bg-black/20 p-3 print:bg-slate-100 sm:p-4"><Gauge className="mb-2 text-cyan-300 print:text-slate-700" size={20} /><p className="print-muted text-xs text-slate-400">Hastighed</p><p className="mt-1 text-lg font-semibold sm:text-xl">{valid ? (distance / (totalMinutes / 60)).toFixed(1) : "–"}</p><p className="text-xs text-slate-500">km/t</p></div>
              </div>
            </div>
          </div>
        </section>

        {calculated && valid && <>
          <section className="print-card mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 sm:mt-8 sm:p-7">
            <div className="mb-5 flex items-start gap-3"><Trophy className="mt-0.5 shrink-0 text-amber-300 print:text-slate-700" /><div><h2 className="text-xl font-bold sm:text-2xl">Forventede konkurrencetider</h2><p className="print-muted mt-1 text-sm leading-5 text-slate-400">Teoretiske ækvivalenter, som forudsætter passende træning til den enkelte distance.</p></div></div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {predictions.map((prediction) => <div key={prediction.name} className={`rounded-2xl border p-3 sm:p-4 ${prediction.km === distance ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/10 bg-slate-900/60"} print:border-slate-200 print:bg-white`}><div className="flex flex-wrap items-center justify-between gap-1"><p className="text-xs text-slate-400 print:text-slate-600 sm:text-sm">{prediction.name}</p>{prediction.km === distance && <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-950">Dit input</span>}</div><p className="mt-1 text-xl font-bold tabular-nums sm:text-2xl">{formatTime(prediction.time)}</p><p className="mt-1 text-xs text-cyan-300 print:text-slate-600 sm:text-sm">{formatPace(prediction.time / prediction.km)} min/km</p></div>)}
            </div>
          </section>
          <section className="print-card mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 sm:mt-8 sm:p-7">
            <h2 className="text-xl font-bold sm:text-2xl">Dine vejledende træningstempoer</h2>
            <p className="print-muted mt-2 max-w-3xl text-sm leading-6 text-slate-400">Brug tempoerne som udgangspunkt, og tilpas efter terræn, vejr og dagsform.</p>
            <div className="mt-5 space-y-3">
              {zones.map((zone) => <article key={zone.key} className={`rounded-2xl border p-4 ${zone.soft} print:border-slate-200 print:bg-white`}><div className="flex items-start gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${zone.color} font-black text-white print:bg-slate-700`}>{zone.key}</div><div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-semibold">{zone.name}</h3><p className="whitespace-nowrap font-mono font-bold text-cyan-200 print:text-black">{formatPace(zone.slow)}–{formatPace(zone.fast)} min/km</p></div><p className="print-muted mt-2 text-sm text-slate-300">{zone.purpose}</p><p className="mt-1 text-xs text-slate-500"><strong>Fornemmelse:</strong> {zone.guidance}</p></div></div></article>)}
            </div>
          </section>
          <section className="no-print mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 sm:mt-8 sm:p-7">
            <button onClick={() => setShowMethod(!showMethod)} aria-expanded={showMethod} className="flex w-full items-center justify-between gap-4 text-left"><span className="flex items-center gap-3"><Info className="shrink-0 text-cyan-300" size={21} /><span><span className="block font-semibold">Sådan læser du resultatet</span><span className="mt-0.5 block text-xs text-slate-500">Kort forklaring af VDOT og anvendelsen</span></span></span><ChevronDown className={`shrink-0 transition ${showMethod ? "rotate-180" : ""}`} /></button>
            {showMethod && <div className="mt-5 space-y-4 border-t border-white/10 pt-5 text-sm leading-6 text-slate-300">
              {["VDOT er et formestimat, der samler fart og varighed i ét tal.", "En højere score betyder normalt bedre løbeform. Sammenlign primært med dine egne tidligere resultater.", "Prognoserne er ikke garantier. En 5 km-præstation kræver anden træning end et maraton.", "Brug en nylig tid, du faktisk har præsteret, og ikke en ønsket måltid."].map((text) => <div key={text} className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={18} /><p>{text}</p></div>)}
            </div>}
          </section>
          {saved.length > 0 && <section className="no-print mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 sm:mt-8 sm:p-7">
            <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Gemte beregninger</h2><p className="mt-1 text-sm text-slate-500">Gemmes kun i browseren på denne enhed.</p></div><button onClick={() => { persistSaved([]); flash("Alle gemte beregninger er slettet"); }} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-400 hover:bg-white/10 hover:text-rose-300" aria-label="Slet alle"><Trash2 size={17} /></button></div>
            <div className="space-y-2">{saved.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3"><button onClick={() => loadCalculation(item)} className="min-w-0 flex-1 text-left"><span className="block truncate font-semibold">{item.distanceName} · {String(item.hours).padStart(2, "0")}:{String(item.minutes).padStart(2, "0")}:{String(item.seconds).padStart(2, "0")}</span><span className="mt-0.5 block text-xs text-slate-500">VDOT {item.vdot} · {new Date(item.savedAt).toLocaleDateString("da-DK")}</span></button><button onClick={() => deleteCalculation(item.id)} aria-label="Slet beregning" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-rose-300"><X size={17} /></button></div>)}</div>
          </section>}
        </>}
        </>}

        {activePage === "energy-strategy" && <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr] lg:gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start gap-3"><div className="shrink-0 rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><Activity size={22} /></div><div><h2 className="text-lg font-semibold sm:text-xl">Din energiplan</h2><p className="mt-1 text-sm leading-5 text-slate-400">Tilpas planen til dit næste løb og få konkrete mål for energi, væske og salt.</p></div></div>
            <label className="mb-2 block text-sm font-medium" htmlFor="energy-distance">Distance</label>
            <select id="energy-distance" value={energyDistance} onChange={(event) => { setEnergyDistance(Number(event.target.value)); setEnergyCalculated(false); }} className="mb-4 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"><option value="21">Halvmaraton (21 km)</option><option value="42">Maraton (42 km)</option><option value="50">50 km</option><option value="100">100 km</option><option value="160">160 km</option></select>
            <label className="mb-2 block text-sm font-medium" htmlFor="energy-custom-distance">Eller egen distance (km)</label>
            <input id="energy-custom-distance" type="number" min="1" placeholder="Indtast distance" onChange={(event) => { if (event.target.value) setEnergyDistance(Number(event.target.value)); setEnergyCalculated(false); }} className="mb-4 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
            <fieldset><legend className="mb-2 text-sm font-medium">Estimeret sluttid</legend><div className="grid grid-cols-2 gap-3"><label className="text-xs text-slate-400">Timer<input type="number" min="0" value={energyHours} onChange={(event) => { setEnergyHours(Math.max(0, Number(event.target.value) || 0)); setEnergyCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label><label className="text-xs text-slate-400">Minutter<input type="number" min="0" max="59" value={energyMinutes} onChange={(event) => { setEnergyMinutes(Math.min(59, Math.max(0, Number(event.target.value) || 0))); setEnergyCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label></div></fieldset>
            <label className="mt-4 block text-sm font-medium" htmlFor="energy-weight">Vægt (kg)</label><input id="energy-weight" type="number" min="1" value={energyWeight} onChange={(event) => { setEnergyWeight(Math.max(0, Number(event.target.value) || 0)); setEnergyCalculated(false); }} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
            <p className="mt-5 text-sm font-medium">Kulhydrat pr. time</p><div className="mt-2 grid grid-cols-3 gap-2">{[[0.5, "Lav"], [0.75, "Middel"], [1, "Høj"]].map(([value, label]) => <button key={String(value)} onClick={() => setEnergyCarbs(Number(value))} className={`min-h-11 rounded-xl border px-2 text-sm font-semibold ${energyCarbs === value ? "border-cyan-300 bg-cyan-400 text-slate-950" : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"}`}>{label}<span className="block text-[10px] font-normal">{Number(value) * 60} g/t</span></button>)}</div>
            <label className="mt-5 block text-sm font-medium" htmlFor="energy-temperature">Temperatur (°C)</label><input id="energy-temperature" type="number" value={energyTemperature} onChange={(event) => { setEnergyTemperature(Number(event.target.value) || 0); setEnergyCalculated(false); }} className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20" />
            {!energyValid && <p className="mt-3 rounded-xl bg-rose-400/10 p-3 text-sm text-rose-300">Indtast distance, tid og vægt større end nul.</p>}
            <button disabled={!energyValid} onClick={() => setEnergyCalculated(true)} className="mt-6 min-h-12 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40">Opret energistrategi</button>
          </div>
          <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-blue-500/5 p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300 sm:text-sm">Din anbefaling</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Energistrategi</h2>{energyCalculated && energyValid ? <><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-slate-400">Kulhydrat</p><p className="mt-1 text-2xl font-bold">{Math.round(energyCarbGrams)} g</p></div><div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-slate-400">Energi</p><p className="mt-1 text-2xl font-bold">{Math.round(energyCalories)} kcal</p></div><div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-slate-400">Væske</p><p className="mt-1 text-2xl font-bold">{energyWater} ml</p></div><div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-slate-400">Salt</p><p className="mt-1 text-2xl font-bold">{energySalt} mg</p></div></div><div className="mt-6 space-y-3"><h3 className="text-lg font-bold">Eksempel på indtag under løbet</h3><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="font-semibold text-cyan-200">Gels og kulhydrat</p><p className="mt-1 text-sm text-slate-400">Tag cirka {Math.round(energyCarbs * 60)} g kulhydrat i timen. Det svarer typisk til én gel ad gangen:</p><div className="mt-3 flex flex-wrap gap-2">{energyGelSchedule.map((point, index) => <span key={`gel-${index}`} className="rounded-lg bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">Gel {index + 1}: {Math.round(point.minutes)} min · km {point.km.toFixed(1)}</span>)}</div></div><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="font-semibold text-amber-200">Saltkapsler</p><p className="mt-1 text-sm text-slate-400">Et eksempel er én kapsel cirka hver time, især ved varme eller hvis du sveder meget:</p><div className="mt-3 flex flex-wrap gap-2">{energySaltSchedule.map((point, index) => <span key={`salt-${index}`} className="rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-100">Kapsel {index + 1}: {Math.round(point.minutes)} min · km {point.km.toFixed(1)}</span>)}</div></div><div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="font-semibold text-sky-200">Væske</p><p className="mt-1 text-sm text-slate-400">Drik små slurke regelmæssigt i stedet for at vente til du bliver tørstig. Sigt efter cirka {Math.round(energyWater / energyDuration)} ml i timen:</p><div className="mt-3 flex flex-wrap gap-2">{energyWaterSchedule.map((point, index) => <span key={`water-${index}`} className="rounded-lg bg-sky-400/10 px-3 py-2 text-xs text-sky-100">Drik {index + 1}: {Math.round(point.minutes)} min · km {point.km.toFixed(1)}</span>)}</div></div></div><div className="mt-5 rounded-2xl border border-cyan-300/15 bg-black/20 p-4 text-sm leading-6 text-slate-300"><strong className="text-white">Husk:</strong> Træn strategien på forhånd, og følg altid doseringen på dine konkrete gels og saltkapsler. Vejledningen er et udgangspunkt og ikke medicinsk rådgivning.</div></> : <p className="mt-5 text-sm leading-7 text-slate-400">Udfyld felterne og tryk på knappen for at få en personlig anbefaling.</p>}</div>
        </section>}

        {activePage === "energy-strategy" && <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-6 text-slate-400"><strong className="text-white">Beregningens antagelser:</strong> 40 g kulhydrat pr. High5-gel. Saltkapsler har ikke et fast mg-indhold i beregningen; den viser i stedet et samlet saltbehov på {energySalt} mg og foreslår cirka én kapsel i timen.</p>}

        {activePage === "training-load" && <>
          <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr] lg:gap-6">
            <div className="no-print rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:p-7">
              <div className="mb-5 flex items-start gap-3"><div className="shrink-0 rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><Activity size={22} /></div><div><h2 className="text-lg font-semibold sm:text-xl">Dit træningspas</h2><p className="mt-1 text-sm leading-5 text-slate-400">Angiv hvor længe og hvor hårdt passet føltes.</p></div></div>
              <label className="mb-2 block text-sm font-medium" htmlFor="load-activity">Aktivitet</label>
              <select id="load-activity" value={loadActivity} onChange={(event) => { setLoadActivity(event.target.value); setLoadCalculated(false); }} className="mb-4 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-base outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"><option>Løb</option><option>Gang</option><option>Cykling</option><option>Svømning</option><option>Styrketræning</option></select>
              <div className="grid grid-cols-2 gap-3"><label className="text-sm text-slate-400" htmlFor="load-duration">Varighed (min)<input id="load-duration" type="number" min="1" value={loadDuration} onChange={(event) => { setLoadDuration(Math.max(0, Number(event.target.value) || 0)); setLoadCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label><label className="text-sm text-slate-400" htmlFor="load-distance">Distance (km)<input id="load-distance" type="number" min="0" step="0.1" value={loadDistance} onChange={(event) => { setLoadDistance(Math.max(0, Number(event.target.value) || 0)); setLoadCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label></div>
              <label className="mt-5 block text-sm font-medium" htmlFor="load-rpe">Oplevet anstrengelse (RPE): {loadRpe}/10</label>
              <input id="load-rpe" type="range" min="1" max="10" value={loadRpe} onChange={(event) => { setLoadRpe(Number(event.target.value)); setLoadCalculated(false); }} className="mt-3 w-full accent-cyan-400" />
              <div className="mt-1 flex justify-between text-xs text-slate-500"><span>Meget let</span><span>Maksimal indsats</span></div>
              <p className="mt-4 rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs leading-5 text-slate-400">RPE er din egen vurdering af, hvor hårdt passet føltes. En rolig tur kan være 2–4, et hårdt kvalitetspas 7–9.</p>
              <div className="mt-5 border-t border-white/10 pt-5"><p className="text-sm font-medium">Træningsmængde</p><p className="mt-1 text-xs leading-5 text-slate-500">Indtast samlet løbedistance fra de seneste perioder. Det gør det lettere at opdage en pludselig stigning i mængden.</p><div className="mt-3 grid grid-cols-2 gap-3"><label className="text-sm text-slate-400" htmlFor="load-7-days">Seneste 7 dage (km)<input id="load-7-days" type="number" min="0" step="0.1" value={load7Distance} onChange={(event) => { setLoad7Distance(Math.max(0, Number(event.target.value) || 0)); setLoadCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label><label className="text-sm text-slate-400" htmlFor="load-30-days">Seneste 30 dage (km)<input id="load-30-days" type="number" min="0" step="0.1" value={load30Distance} onChange={(event) => { setLoad30Distance(Math.max(0, Number(event.target.value) || 0)); setLoadCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label></div></div>
              <button disabled={loadDuration <= 0} onClick={() => setLoadCalculated(true)} className="mt-6 min-h-12 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40">Beregn belastning</button>
            </div>
            <div className="print-card rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-blue-500/5 p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300 sm:text-sm">Din træningsbelastning</p>
              <div className="mt-3 flex items-end gap-2"><span className="text-6xl font-black tabular-nums sm:text-7xl">{loadCalculated ? trainingLoad : "–"}</span><span className="mb-2 text-lg text-slate-400">point</span></div>
              {loadCalculated && <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-black/20 p-4"><div className="flex items-start gap-3"><Gauge className="mt-0.5 shrink-0 text-cyan-300" size={20} /><div><h2 className={`font-semibold ${loadLevel.color}`}>{loadLevel.label}</h2><p className="mt-1 text-sm leading-6 text-slate-300">{loadLevel.advice}</p></div></div></div>}
              <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3"><div className="rounded-2xl bg-black/20 p-3 sm:p-4"><p className="text-xs text-slate-400">Aktivitet</p><p className="mt-1 font-semibold">{loadActivity}</p></div><div className="rounded-2xl bg-black/20 p-3 sm:p-4"><p className="text-xs text-slate-400">Tid</p><p className="mt-1 font-semibold">{loadDuration} min</p></div><div className="rounded-2xl bg-black/20 p-3 sm:p-4"><p className="text-xs text-slate-400">RPE</p><p className="mt-1 font-semibold">{loadRpe}/10</p></div></div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-start gap-3"><Target className="mt-0.5 shrink-0 text-cyan-300" size={20} /><div><p className="font-semibold">Din træningsmængde</p><p className="mt-1 text-sm text-slate-300">{load7Distance.toFixed(1)} km de seneste 7 dage · {load30Distance.toFixed(1)} km de seneste 30 dage</p><p className={`mt-2 text-sm font-semibold ${volumeLevel.color}`}>{volumeLevel.label} · {volumeRatio.toFixed(2)}× af dit 30-dages ugegennemsnit</p><p className="mt-1 text-xs leading-5 text-slate-400">{volumeLevel.advice}</p></div></div></div>
            </div>
          </section>
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 sm:mt-8 sm:p-7"><h2 className="text-xl font-bold sm:text-2xl">Sådan bruger du resultatet</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Belastningspoint beregnes som varighed ganget med oplevet anstrengelse (RPE). Brug tallet til at sammenligne dine egne pas over tid. Et enkelt højt tal er ikke et problem, men flere hårde pas i træk kræver ekstra restitution.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><p className="font-semibold text-emerald-300">Under 150</p><p className="mt-2 text-sm text-slate-400">Let pas eller restitution.</p></div><div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><p className="font-semibold text-amber-300">150–299</p><p className="mt-2 text-sm text-slate-400">Moderat, normal træning.</p></div><div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><p className="font-semibold text-rose-300">300+</p><p className="mt-2 text-sm text-slate-400">Hårdt pas, planlæg hvile.</p></div></div></section>
        </>}

        {activePage === "recovery" && <>
          <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr] lg:gap-6">
            <div className="no-print rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:p-7">
              <div className="mb-5 flex items-start gap-3"><div className="shrink-0 rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><Activity size={22} /></div><div><h2 className="text-lg font-semibold sm:text-xl">Dit løb</h2><p className="mt-1 text-sm leading-5 text-slate-400">Fortæl om passet og din aktuelle dagsform.</p></div></div>
              <div className="grid grid-cols-2 gap-3"><label className="text-sm text-slate-400" htmlFor="recovery-duration">Varighed (min)<input id="recovery-duration" type="number" min="5" value={recoveryDuration} onChange={(event) => { setRecoveryDuration(Math.max(0, Number(event.target.value) || 0)); setRecoveryCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label><label className="text-sm text-slate-400" htmlFor="recovery-weekly-distance">Ugentlig mængde (km)<input id="recovery-weekly-distance" type="number" min="0" step="0.1" value={recoveryWeeklyDistance} onChange={(event) => { setRecoveryWeeklyDistance(Math.max(0, Number(event.target.value) || 0)); setRecoveryCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label></div>
              <label className="mt-4 block text-sm font-medium" htmlFor="recovery-intensity">Intensitet</label><select id="recovery-intensity" value={recoveryIntensityKey} onChange={(event) => { setRecoveryIntensityKey(event.target.value as keyof typeof recoveryIntensity); setRecoveryCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"><option value="recovery">Meget rolig tur</option><option value="easy">Rolig aerob tur</option><option value="steady">Moderat tur</option><option value="tempo">Tempo eller tærskel</option><option value="interval">Intervaller eller bakker</option><option value="long">Lang tur</option><option value="race">Konkurrence eller test</option></select>
              <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm text-slate-400" htmlFor="recovery-sleep">Søvn i nat (timer)<input id="recovery-sleep" type="number" min="0" max="12" step="0.1" value={recoverySleep} onChange={(event) => { setRecoverySleep(Math.max(0, Number(event.target.value) || 0)); setRecoveryCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label><label className="text-sm text-slate-400" htmlFor="recovery-age">Alder<input id="recovery-age" type="number" min="12" value={recoveryAge} onChange={(event) => { setRecoveryAge(Math.max(12, Number(event.target.value) || 0)); setRecoveryCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label></div>
              <label className="mt-4 block text-sm font-medium" htmlFor="recovery-soreness">Ømhed i benene: {recoverySoreness}/10</label><input id="recovery-soreness" type="range" min="1" max="10" value={recoverySoreness} onChange={(event) => { setRecoverySoreness(Number(event.target.value)); setRecoveryCalculated(false); }} className="mt-3 w-full accent-cyan-400" /><div className="flex justify-between text-xs text-slate-500"><span>Frisk</span><span>Meget øm</span></div>
              <label className="mt-4 block text-sm font-medium" htmlFor="recovery-heat">Varme og fugt</label><select id="recovery-heat" value={recoveryHeat} onChange={(event) => { setRecoveryHeat(event.target.value); setRecoveryCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"><option value="cool">Køligt eller tørt</option><option value="mild">Mildt</option><option value="warm">Varmt eller fugtigt</option><option value="hot">Meget varmt</option><option value="extreme">Ekstrem varme</option></select>
              <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm text-slate-400" htmlFor="recovery-elevation">Højdemeter (m)<input id="recovery-elevation" type="number" min="0" value={recoveryElevation} onChange={(event) => { setRecoveryElevation(Math.max(0, Number(event.target.value) || 0)); setRecoveryCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label><label className="text-sm text-slate-400" htmlFor="recovery-next-session">Næste planlagte pas<select id="recovery-next-session" value={recoveryNextSession} onChange={(event) => { setRecoveryNextSession(event.target.value); setRecoveryCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-2 py-3 text-sm text-white outline-none focus:border-cyan-400"><option value="easy">Rolig løbetur</option><option value="quality">Hårdt kvalitetspas</option><option value="rest">Hvile eller gåtur</option></select></label></div>
              <button disabled={recoveryDuration < 5} onClick={() => setRecoveryCalculated(true)} className="mt-6 min-h-12 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40">Beregn restitution</button>
            </div>
            <div className="print-card rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-blue-500/5 p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300 sm:text-sm">Din anbefaling</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">Restitutionsvindue</h2><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-slate-400">Før let løb</p><p className="mt-1 text-2xl font-bold">{recoveryCalculated ? Math.round(recoveryEasyHours) : "–"} timer</p></div><div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-slate-400">Før hårdt pas</p><p className="mt-1 text-2xl font-bold">{recoveryCalculated ? Math.round(recoveryHours) : "–"} timer</p></div></div>{recoveryCalculated && <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-black/20 p-4"><div className="flex items-start gap-3"><Clock3 className="mt-0.5 shrink-0 text-cyan-300" size={20} /><div><h3 className="font-semibold text-cyan-200">Vent cirka {Math.round(recoveryBufferHours)} timer ekstra før kvalitet</h3><p className="mt-1 text-sm leading-6 text-slate-300">{recoveryAdvice(recoveryHours)}</p></div></div></div>}<div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3"><div className="rounded-2xl bg-black/20 p-3 sm:p-4"><p className="text-xs text-slate-400">Intensitet</p><p className="mt-1 text-sm font-semibold">{recoveryIntensityData.label}</p></div><div className="rounded-2xl bg-black/20 p-3 sm:p-4"><p className="text-xs text-slate-400">Søvn</p><p className="mt-1 font-semibold">{recoverySleep} t</p></div><div className="rounded-2xl bg-black/20 p-3 sm:p-4"><p className="text-xs text-slate-400">Ømhed</p><p className="mt-1 font-semibold">{recoverySoreness}/10</p></div></div></div>
          </section>
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 sm:mt-8 sm:p-7"><h2 className="text-xl font-bold sm:text-2xl">Hvad betyder resultatet?</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Restitutionsvinduet er et estimat på, hvor længe du bør vente, før du udsætter kroppen for den næste betydelige træningsbelastning. Det er ikke et forbud mod at gå en tur eller lave let bevægelse.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><p className="font-semibold text-emerald-300">Let løb</p><p className="mt-2 text-sm text-slate-400">Bruges som pejlemærke for en rolig tur, hvis benene føles friske.</p></div><div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><p className="font-semibold text-amber-300">Hårdt pas</p><p className="mt-2 text-sm text-slate-400">Vent længere efter tempo, intervaller, bakker eller konkurrence.</p></div><div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><p className="font-semibold text-cyan-300">Lyt til kroppen</p><p className="mt-2 text-sm text-slate-400">Ved skarp eller vedvarende smerte bør du stoppe og søge faglig rådgivning.</p></div></div></section>
        </>}

        {activePage === "race-strategy" && <>
          <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr] lg:gap-6">
            <div className="no-print rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:p-7">
              <div className="mb-5 flex items-start gap-3"><div className="shrink-0 rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><Trophy size={22} /></div><div><h2 className="text-lg font-semibold sm:text-xl">Dit løbsmål</h2><p className="mt-1 text-sm leading-5 text-slate-400">Planlæg en fart, du kan holde hele vejen til mål.</p></div></div>
              <label className="mb-2 block text-sm font-medium" htmlFor="strategy-distance">Distance</label><select id="strategy-distance" value={strategyDistance} onChange={(event) => { setStrategyDistance(Number(event.target.value)); setStrategyCalculated(false); }} className="mb-4 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"><option value="5">5 km</option><option value="10">10 km</option><option value="21.0975">Halvmaraton</option><option value="42.195">Maraton</option></select>
              <fieldset><legend className="mb-2 text-sm font-medium">Måltid</legend><div className="grid grid-cols-3 gap-2"><label className="text-xs text-slate-400">Timer<input type="number" min="0" value={strategyHours} onChange={(event) => { setStrategyHours(Math.max(0, Number(event.target.value) || 0)); setStrategyCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-2 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label><label className="text-xs text-slate-400">Minutter<input type="number" min="0" max="59" value={strategyMinutes} onChange={(event) => { setStrategyMinutes(Math.min(59, Math.max(0, Number(event.target.value) || 0))); setStrategyCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-2 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label><label className="text-xs text-slate-400">Sekunder<input type="number" min="0" max="59" value={strategySeconds} onChange={(event) => { setStrategySeconds(Math.min(59, Math.max(0, Number(event.target.value) || 0))); setStrategyCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-2 py-3 text-center text-lg text-white outline-none focus:border-cyan-400" /></label></div></fieldset>
              <label className="mt-4 block text-sm font-medium" htmlFor="strategy-profile">Pacingstrategi</label><select id="strategy-profile" value={strategyProfile} onChange={(event) => { setStrategyProfile(event.target.value as keyof typeof raceStrategyProfiles); setStrategyCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"><option value="even">Jævn fart</option><option value="negative">Negativ split</option><option value="positive">Positiv split</option><option value="progressive">Progressiv fart</option></select>
              <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm text-slate-400" htmlFor="strategy-terrain">Terræn<select id="strategy-terrain" value={strategyTerrain} onChange={(event) => { setStrategyTerrain(event.target.value); setStrategyCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"><option value="flat">Fladt</option><option value="rolling">Let kuperet</option><option value="hilly">Meget kuperet</option></select></label><label className="text-sm text-slate-400" htmlFor="strategy-temperature">Temperatur<select id="strategy-temperature" value={strategyTemperature} onChange={(event) => { setStrategyTemperature(event.target.value); setStrategyCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-400"><option value="cool">Køligt</option><option value="mild">Mildt</option><option value="warm">Varmt</option><option value="hot">Meget varmt</option></select></label></div>
              <button disabled={strategyGoalMinutes <= 0} onClick={() => setStrategyCalculated(true)} className="mt-6 min-h-12 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40">Beregn løbsstrategi</button>
            </div>
            <div className="print-card rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 to-blue-500/5 p-5 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300 sm:text-sm">Din pacingplan</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">{strategyProfileData.label}</h2><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-slate-400">Grundtempo</p><p className="mt-1 text-2xl font-bold">{strategyCalculated ? formatPace(strategyGoalMinutes / strategyDistance) : "–"}</p><p className="text-xs text-slate-500">min/km</p></div><div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-slate-400">Justeret mål</p><p className="mt-1 text-2xl font-bold">{strategyCalculated ? formatTime(strategyAdjustedMinutes) : "–"}</p></div></div><div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20"><div className="grid grid-cols-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400"><span>Del</span><span>Fart</span><span className="text-right">Akkumuleret</span></div>{strategyCalculated && strategySplits.map((split, index) => <div key={split.number} className="grid grid-cols-3 border-b border-white/10 px-4 py-3 text-sm last:border-0"><span>Del {split.number}</span><span>{formatPace(split.pace)} min/km</span><span className="text-right font-semibold">{formatTime(strategySplits.slice(0, index + 1).reduce((total, item) => total + item.pace * (strategyDistance / 5), 0))}</span></div>)}</div></div>
          </section>
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 sm:mt-8 sm:p-7"><h2 className="text-xl font-bold sm:text-2xl">Sådan bruger du planen</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Grundtempoet er din måltid delt med distancen. Den justerede plan tager højde for varme og kuperet terræn, så du ikke starter for aggressivt. For de fleste motionsløbere er jævn fart eller en let negativ split den bedste strategi.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><p className="font-semibold text-emerald-300">Første del</p><p className="mt-2 text-sm text-slate-400">Start kontrolleret. Det skal føles lidt for let i begyndelsen.</p></div><div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><p className="font-semibold text-cyan-300">Midten</p><p className="mt-2 text-sm text-slate-400">Find rytmen og hold dig til planen, også når andre løbere sætter farten op.</p></div><div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><p className="font-semibold text-amber-300">Sidste del</p><p className="mt-2 text-sm text-slate-400">Øg først farten, når du har kræfter til en stærk afslutning.</p></div></div></section>
        </>}

        {activePage === "checklists" && <>
          <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr] lg:gap-6">
            <div className="no-print rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:p-7">
              <div className="mb-5 flex items-start gap-3"><div className="shrink-0 rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><CheckCircle2 size={22} /></div><div><h2 className="text-lg font-semibold sm:text-xl">Er du klar til løbet?</h2><p className="mt-1 text-sm leading-5 text-slate-400">Svar ærligt på spørgsmålene og brug resultatet som et pejlemærke.</p></div></div>
              <label className="block text-sm font-medium" htmlFor="checklist-sleep">Søvn i nat: {checklistSleep} timer</label><input id="checklist-sleep" type="range" min="0" max="10" step="0.5" value={checklistSleep} onChange={(event) => { setChecklistSleep(Number(event.target.value)); setChecklistCalculated(false); }} className="mt-3 w-full accent-cyan-400" /><div className="flex justify-between text-xs text-slate-500"><span>Ingen søvn</span><span>10 timer</span></div>
              <label className="mt-5 block text-sm font-medium" htmlFor="checklist-stress">Stress i hverdagen: {checklistStress}/10</label><input id="checklist-stress" type="range" min="1" max="10" value={checklistStress} onChange={(event) => { setChecklistStress(Number(event.target.value)); setChecklistCalculated(false); }} className="mt-3 w-full accent-cyan-400" /><div className="flex justify-between text-xs text-slate-500"><span>Lav</span><span>Meget høj</span></div>
              <label className="mt-5 block text-sm font-medium" htmlFor="checklist-soreness">Ømhed eller smerter: {checklistSoreness}/10</label><input id="checklist-soreness" type="range" min="1" max="10" value={checklistSoreness} onChange={(event) => { setChecklistSoreness(Number(event.target.value)); setChecklistCalculated(false); }} className="mt-3 w-full accent-cyan-400" /><div className="flex justify-between text-xs text-slate-500"><span>Frisk</span><span>Meget øm</span></div>
              <label className="mt-5 block text-sm font-medium" htmlFor="checklist-motivation">Lyst og motivation: {checklistMotivation}/10</label><input id="checklist-motivation" type="range" min="1" max="10" value={checklistMotivation} onChange={(event) => { setChecklistMotivation(Number(event.target.value)); setChecklistCalculated(false); }} className="mt-3 w-full accent-cyan-400" /><div className="flex justify-between text-xs text-slate-500"><span>Lav</span><span>Meget høj</span></div>
              <label className="mt-5 block text-sm font-medium" htmlFor="checklist-symptoms">Har du sygdomssymptomer?</label><select id="checklist-symptoms" value={checklistSymptoms} onChange={(event) => { setChecklistSymptoms(event.target.value); setChecklistCalculated(false); }} className="mt-1 min-h-12 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"><option value="no">Nej</option><option value="yes">Ja</option></select>
              <button onClick={() => setChecklistCalculated(true)} className="mt-6 min-h-12 w-full rounded-xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300">Vurder min parathed</button>
            </div>
            <div className={`print-card rounded-3xl border p-5 sm:p-8 ${checklistStatus.panel}`}><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300 sm:text-sm">Din parathed</p><div className="mt-3 flex items-end gap-2"><span className={`text-6xl font-black tabular-nums sm:text-7xl ${checklistStatus.color}`}>{checklistCalculated ? Math.round(checklistScore) : "–"}</span><span className="mb-2 text-lg text-slate-400">/ 100</span></div>{checklistCalculated && <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-start gap-3"><Sparkles className={`mt-0.5 shrink-0 ${checklistStatus.color}`} size={20} /><div><h2 className={`font-semibold ${checklistStatus.color}`}>{checklistStatus.label}</h2><p className="mt-1 text-sm leading-6 text-slate-300">{checklistStatus.advice}</p></div></div></div>}<p className="mt-5 text-xs leading-5 text-slate-400">Vurderingen er et støtteværktøj. Den kan ikke afgøre, om du er skadet eller syg, og den erstatter ikke din egen dømmekraft.</p></div>
          </section>
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 sm:mt-8 sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold sm:text-2xl">Din løbscheckliste</h2><p className="mt-2 text-sm leading-6 text-slate-400">Brug listen som en rolig plan fra dagen før til timerne efter mål.</p></div><div className="flex items-center gap-3"><span className="text-sm font-semibold text-cyan-300">{checkedCount}/{checklistTotal} klaret</span><button onClick={() => setCheckedItems({})} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white">Nulstil</button></div></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-900"><div className="h-full rounded-full bg-cyan-400 transition-all" style={{ width: `${checklistTotal ? checkedCount / checklistTotal * 100 : 0}%` }} /></div><div className="mt-6 grid gap-4 lg:grid-cols-2">{raceChecklistGroups.map((group) => <div key={group.title} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><h3 className="font-semibold text-cyan-200">{group.title}</h3><div className="mt-3 space-y-2">{group.items.map((item) => { const itemKey = `${group.title}-${item}`; return <label key={itemKey} className="flex cursor-pointer items-start gap-3 rounded-xl p-2 text-sm leading-5 text-slate-300 transition hover:bg-white/5"><input type="checkbox" checked={Boolean(checkedItems[itemKey])} onChange={(event) => setCheckedItems((current) => ({ ...current, [itemKey]: event.target.checked }))} className="mt-1 h-4 w-4 shrink-0 accent-cyan-400" /><span className={checkedItems[itemKey] ? "text-slate-500 line-through" : ""}>{item}</span></label>; })}</div></div>)}</div></section>
        </>}

        {activePage === "exercises" && <>
          <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-4 sm:p-7">
            <div className="mb-6 flex items-start gap-3"><Activity className="mt-0.5 shrink-0 text-cyan-300" /><div><h2 className="text-xl font-bold sm:text-2xl">Løbedrills til bedre teknik</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">Brug drillene som en kort, fokuseret del af opvarmningen. Vælg 2–4 øvelser, og hold kvaliteten høj frem for at jagte fart.</p></div></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {runningDrills.map((drill, index) => <article key={drill.name} className="flex min-h-64 flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-4 transition hover:border-cyan-400/30 hover:bg-slate-900">
                <div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-400/15 text-sm font-black text-cyan-300">{String(index + 1).padStart(2, "0")}</span><span className="rounded-full border border-cyan-400/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">{drill.category}</span></div>
                <h3 className="mt-5 text-lg font-bold">{drill.name}</h3><p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Fokus: {drill.focus}</p><p className="mt-3 flex-1 text-sm leading-6 text-slate-400">{drill.description}</p>
                <div className="mt-4 border-t border-white/10 pt-3"><p className="text-sm font-semibold text-white">{drill.dosage}</p><p className="mt-1 text-xs leading-5 text-slate-500"><strong className="text-slate-400">Tekniksignal:</strong> {drill.cue}</p></div>
              </article>)}
            </div>
          </section>
          <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.045] p-4 sm:mt-8 sm:p-7">
            <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Klar til brug</p><h2 className="mt-2 text-xl font-bold sm:text-2xl">Workouts med løbedrills</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Vælg en workout efter dagens pas. Gå eller jog roligt tilbage mellem gentagelserne, og stop hvis du mister kontrol over teknikken.</p></div>
            <div className="grid gap-3 lg:grid-cols-3">
              {runningWorkouts.map((workout) => <article key={workout.name} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold">{workout.name}</h3><span className="whitespace-nowrap rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold text-slate-400">{workout.duration}</span></div><p className="mt-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">{workout.level}</p><p className="mt-3 text-sm leading-6 text-slate-400">{workout.purpose}</p><ol className="mt-4 space-y-2 border-t border-white/10 pt-3">{workout.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm text-slate-300"><span className="font-mono text-xs text-slate-500">{index + 1}.</span><span>{step}</span></li>)}</ol></article>)}
            </div>
          </section>
          <section className="mt-6 grid gap-3 sm:grid-cols-3 sm:mt-8">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4"><p className="font-semibold text-emerald-300">1. Varm op</p><p className="mt-2 text-sm leading-6 text-slate-400">Start med 8–10 minutters rolig jog og bevæg leddene frit.</p></div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4"><p className="font-semibold text-cyan-300">2. Vælg få drills</p><p className="mt-2 text-sm leading-6 text-slate-400">Lav 2–4 øvelser med rolig gang eller jog som pause mellem gentagelserne.</p></div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4"><p className="font-semibold text-amber-300">3. Overfør til løb</p><p className="mt-2 text-sm leading-6 text-slate-400">Afslut eventuelt med 2–4 korte stigningsløb, før dagens hovedpas begynder.</p></div>
          </section>
        </>}

        <footer className="print-muted mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs leading-5 text-amber-100 print:border-slate-200 print:bg-white print:text-slate-600 sm:mt-8 sm:text-sm">
          <strong>Bemærk:</strong> Beregningen er vejledende og ikke medicinsk rådgivning. Tilpas altid træningen efter erfaring, dagsform, underlag og vejr.
        </footer>
      </div>
    </main>
  );
}