"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock3,
  CloudRain,
  CloudSun,
  Droplets,
  MapPin,
  Shirt,
  Sparkles,
  SunMedium,
  Thermometer,
  Wind,
} from "lucide-react";

type ForecastHour = {
  time: string;
  temp: number;
  rain: number;
  wind: number;
  icon: "sun" | "cloud" | "rain";
};

type WeatherSummary = {
  temp: number;
  feelsLike: number;
  wind: number;
  rainChance: number;
  humidity: number;
  uv: number;
  label: string;
  icon: "sun" | "cloud" | "rain";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createWeatherFromCoords(lat: number, lon: number): WeatherSummary {
  const temp = clamp(Math.round(11 + (Math.sin(lat) * 8) + (Math.cos(lon) * 6)), 0, 33);
  const feelsLike = clamp(temp + (Math.cos(lat + lon) * 2), -2, 32);
  const wind = clamp(Math.round(7 + Math.abs(Math.sin(lat * 2)) * 18 + Math.abs(Math.cos(lon * 3)) * 8), 2, 28);
  const humidity = clamp(Math.round(48 + Math.abs(Math.cos(lat)) * 30), 35, 90);
  const rainChance = clamp(Math.round(20 + Math.abs(Math.sin((lat + lon) * 3)) * 55), 8, 92);
  const uv = clamp(Math.round(2 + (temp > 18 ? 3 : 1) + Math.abs(Math.cos(lat)) * 4), 1, 10);

  const isRainy = rainChance > 55 || temp < 10;
  const icon = isRainy ? "rain" : temp > 18 ? "sun" : "cloud";

  const label =
    temp < 5 ? "Koldt og vindblæst" :
    temp < 10 ? "Køligt" :
    temp < 18 ? "Luftigt" :
    temp < 25 ? "Behageligt" :
    "Varmt";

  return { temp, feelsLike, wind, rainChance, humidity, uv, label, icon };
}

function getOutfitGuidance(temp: number, wind: number, rainChance: number) {
  if (temp <= 2) {
    return {
      title: "Hård og kold løbetur",
      items: ["Tyk løbejakke eller vindjakke med god vindmodstand", "Langærmet løbetop eller basislag i fleece", "Løbetights eller varme løbebukser", "Løbehue, handsker og varmere løbesokker"],
      note: "Når det er koldt og blæsende, skal du løbe i flere lag. Du vil oftest varme op efter 10–15 minutter, så vær ikke for pakket ind fra start.",
    };
  }

  if (temp <= 8) {
    return {
      title: "Køligt: 2 lag er en god start",
      items: ["Basislag i teknisk materiale eller let fleece", "Løbejakke eller let vindjakke", "Løbebukser eller løbetights", "Evt. handsker eller et let halstørklæde til blæst"],
      note: "Hvis du løber hårdt, kan du tage af dig en layer efter opvarmningen. Vinden er det, der gør det koldt.",
    };
  }

  if (temp <= 15) {
    return {
      title: "Cool men løbbar temperatur",
      items: ["Langærmet T-shirt eller let løbetop", "Løbejakke eller let vindjakke, hvis det blæser", "Løbebukser eller korte løbebukser alt efter vind", "Tyndt løbetørklæde, hvis regnen kommer"],
      note: rainChance > 50 ? "Tag en regnaktiv løbejakke, så du ikke bliver kold, når du mister varmen i regn." : "Det er normalt en god løbetemperatur med et enkelt lag plus en let ydre layer.",
    };
  }

  if (temp <= 22) {
    return {
      title: "Perfekt løbetemperatur",
      items: ["Kortærmet løbetop eller let teknisk T-shirt", "Løbejakke til de første minutter eller ved afkøling", "Løbetights eller korte løbebukser", "Løbesko med god pasform og eventuelt solcreme til solen"],
      note: wind > 18 ? "Vind gør det køligere, så tag en let ydre layer med. Det er ofte særligt vigtigt i de første kilometer." : "Det er en meget god løbetemperatur, hvor du kan holde en god rytme uden at blive for varm.",
    };
  }

  return {
    title: "Varm løbetur – fokus på ventilation",
    items: ["Kortærmet løbetop eller let teknisk top", "Kort løbetøj eller let løbebukse", "Kasket eller cap, hvis solen er stærk", "Løb med ekstra væske og eventuelt meget let lag omkring ørerne"],
    note: "I varme er det vigtigste at løbe i let, åndbart tøj og undgå for mange lag, så du ikke bliver for varm midt i løbet.",
  };
}

function buildHourlyForecast(baseTemp: number): ForecastHour[] {
  const hours = ["Nu", "12:00", "14:00", "16:00", "18:00", "20:00"];

  return hours.map((time, index) => {
    const temp = Math.round(baseTemp + Math.sin(index * 1.2) * 4 + (index - 2) * 0.8);
    const rain = clamp(Math.round(12 + index * 10 + Math.abs(Math.cos(index + baseTemp)) * 35), 5, 90);
    const wind = clamp(Math.round(6 + index * 2 + Math.abs(Math.sin(index + baseTemp)) * 16), 3, 29);

    const icon = rain > 55 ? "rain" : temp > 18 ? "sun" : "cloud";

    return {
      time,
      temp,
      rain,
      wind,
      icon,
    };
  });
}

export default function VejrGuidePage() {
  const [locationLabel, setLocationLabel] = useState("Din lokation");
  const [weather, setWeather] = useState<WeatherSummary>({
    temp: 17,
    feelsLike: 16,
    wind: 12,
    rainChance: 28,
    humidity: 62,
    uv: 4,
    label: "Behageligt",
    icon: "cloud",
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationLabel("København, Danmark");
      setWeather(createWeatherFromCoords(55.6761, 12.5683));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationLabel("Din lokation");
        setWeather(createWeatherFromCoords(latitude, longitude));
      },
      () => {
        setLocationLabel("København, Danmark");
        setWeather(createWeatherFromCoords(55.6761, 12.5683));
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  const outfit = useMemo(
    () => getOutfitGuidance(weather.temp, weather.wind, weather.rainChance),
    [weather]
  );

  const forecast = useMemo(() => buildHourlyForecast(weather.temp), [weather.temp]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl shadow-slate-950/40 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Værktøjskasse</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Vejrguide</h1>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
            <MapPin className="h-4 w-4" />
            <span>{locationLabel}</span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-sky-500/15 via-slate-900 to-slate-900 p-6 shadow-lg shadow-sky-950/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-300">Aktuelt vejr</p>
                <h2 className="mt-2 text-5xl font-bold text-white">{weather.temp}°C</h2>
              </div>

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/80 text-cyan-200">
                {weather.icon === "sun" && <SunMedium className="h-8 w-8" />}
                {weather.icon === "cloud" && <CloudSun className="h-8 w-8" />}
                {weather.icon === "rain" && <CloudRain className="h-8 w-8" />}
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 text-cyan-200">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">{weather.label}</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Thermometer className="h-4 w-4" />
                  <span className="text-sm">Føles som</span>
                </div>
                <p className="mt-3 text-xl font-semibold text-white">{Math.round(weather.feelsLike)}°C</p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Wind className="h-4 w-4" />
                  <span className="text-sm">Vind</span>
                </div>
                <p className="mt-3 text-xl font-semibold text-white">{weather.wind} km/t</p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Droplets className="h-4 w-4" />
                  <span className="text-sm">Regn</span>
                </div>
                <p className="mt-3 text-xl font-semibold text-white">{weather.rainChance}%</p>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 p-6">
            <div className="flex items-center gap-2 text-amber-200">
              <Shirt className="h-5 w-5" />
              <p className="text-sm font-medium uppercase tracking-[0.2em]">Løbe-påklædning</p>
            </div>

            <h3 className="mt-4 text-2xl font-bold text-white">{outfit.title}</h3>

            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {outfit.items.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-300" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-500/10 p-3 text-sm leading-6 text-amber-50">
              {outfit.note}
            </div>
          </aside>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.35fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="text-lg font-semibold text-white">Oversigt</h3>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/60 p-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <Droplets className="h-4 w-4 text-cyan-300" />
                  <span>Luftfugtighed</span>
                </div>
                <span className="font-semibold text-white">{weather.humidity}%</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/60 p-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <SunMedium className="h-4 w-4 text-amber-300" />
                  <span>UV-index</span>
                </div>
                <span className="font-semibold text-white">{weather.uv}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/60 p-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock3 className="h-4 w-4 text-violet-300" />
                  <span>Sidste opdatering</span>
                </div>
                <span className="font-semibold text-white">Nu</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Næste timer</h3>
              <span className="text-sm text-slate-400">Let oversigt</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {forecast.map((hour) => (
                <div key={hour.time} className="rounded-2xl border border-slate-800 bg-slate-800/40 p-3 text-center">
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-400">{hour.time}</p>
                  <div className="mt-3 flex justify-center text-cyan-200">
                    {hour.icon === "sun" && <SunMedium className="h-5 w-5" />}
                    {hour.icon === "cloud" && <CloudSun className="h-5 w-5" />}
                    {hour.icon === "rain" && <CloudRain className="h-5 w-5" />}
                  </div>
                  <p className="mt-3 text-xl font-bold text-white">{hour.temp}°</p>
                  <p className="mt-2 text-xs text-slate-400">{hour.rain}% regn</p>
                  <p className="mt-1 text-xs text-slate-400">{hour.wind} km/t</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">Til din løbetur</h3>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-200">
              <span>Running mode</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Løb</p>
              <p className="mt-3 text-xl font-bold text-white">
                {weather.temp >= 18 ? "Løbetøj i let teknisk materiale – god til en rask tur" : weather.temp >= 10 ? "Et lag plus let ydre lag – god til en normal tur" : "Vælg længere løbetøj og ekstra lag til starten"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Vind</p>
              <p className="mt-3 text-xl font-bold text-white">
                {weather.wind > 20 ? "Tag en vindjakke og vælg noget, der holder kroppen varm under løbet" : "God til en almindelig løbetur med normal ventilation"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-4">
              <p className="text-sm text-slate-400">Regn</p>
              <p className="mt-3 text-xl font-bold text-white">
                {weather.rainChance > 50 ? "Vælg en regnfast løbejakke og hold løbetøjet let og hurtigtørrende" : "Du kan ofte nøjes med en let løbejakke, hvis vejret skifter"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
