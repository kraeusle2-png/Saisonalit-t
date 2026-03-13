import { useState, useEffect, useCallback } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────
const TRADES = [
  { id:1,  name:"S&P 500 / DAX",  direction:"LONG",  startMonth:11, endMonth:4,  baseHitRate:75, avgGain:"+7%",      icon:"📈", sector:"Aktien",    fundamentalDriver:"Best Six Months – institutionelle Portfolioanpassungen & Jahresendrallye", stopLoss:9,  volatility:"mittel" },
  { id:2,  name:"Erdgas",          direction:"LONG",  startMonth:9,  endMonth:10, baseHitRate:77, avgGain:"hoch",     icon:"🔥", sector:"Rohstoff",  fundamentalDriver:"Vorheizperiode, Lagerbefüllung vor Winter", stopLoss:18, volatility:"sehr hoch" },
  { id:3,  name:"Gold / Silber",   direction:"LONG",  startMonth:1,  endMonth:2,  baseHitRate:78, avgGain:"+6%",      icon:"🥇", sector:"Edelmetall", fundamentalDriver:"Schmucknachfrage Asien, Jahresbeginn-Käufe", stopLoss:9, volatility:"mittel" },
  { id:4,  name:"Rohöl / Benzin",  direction:"LONG",  startMonth:2,  endMonth:5,  baseHitRate:70, avgGain:"+10%",     icon:"🛢️", sector:"Rohstoff",  fundamentalDriver:"Frühjahrs-Reisesaison, Raffinerie-Umstellungen", stopLoss:13, volatility:"hoch" },
  { id:5,  name:"S&P 500 Q4",      direction:"LONG",  startMonth:10, endMonth:11, baseHitRate:80, avgGain:"+4%",      icon:"🎄", sector:"Aktien",    fundamentalDriver:"Weihnachtsrallye, Q4-Portfolioanpassungen", stopLoss:9, volatility:"mittel" },
  { id:6,  name:"GBP/JPY",         direction:"SHORT", startMonth:7,  endMonth:8,  baseHitRate:80, avgGain:"450 Pips", icon:"💴", sector:"Forex",     fundamentalDriver:"Risk-off Spätsommer, JPY-Stärke als sicherer Hafen", stopLoss:10, volatility:"hoch" },
  { id:7,  name:"AUD/JPY",         direction:"SHORT", startMonth:7,  endMonth:8,  baseHitRate:80, avgGain:"241 Pips", icon:"🦘", sector:"Forex",     fundamentalDriver:"Risk-off Dynamik, JPY sicherer Hafen", stopLoss:10, volatility:"hoch" },
  { id:8,  name:"Zucker",          direction:"SHORT", startMonth:6,  endMonth:8,  baseHitRate:72, avgGain:"mittel",   icon:"🍬", sector:"Rohstoff",  fundamentalDriver:"Erntedruck, Angebotsanstieg Südhalbkugel", stopLoss:13, volatility:"hoch" },
  { id:9,  name:"Kupfer",          direction:"LONG",  startMonth:2,  endMonth:4,  baseHitRate:70, avgGain:"+6%",      icon:"🔶", sector:"Metall",    fundamentalDriver:"Frühjahr-Bausaison, China-Nachfrage", stopLoss:9, volatility:"mittel" },
  { id:10, name:"Nasdaq / Tech",   direction:"LONG",  startMonth:10, endMonth:1,  baseHitRate:75, avgGain:"+10%",     icon:"💻", sector:"Aktien",    fundamentalDriver:"Jahresendrallye + Januar-Effekt", stopLoss:11, volatility:"hoch" },
];

const FILTERS = [
  { id:"trend",       name:"Trendfilter",          desc:"200-MA steigend (Long) / fallend (Short)",         icon:"📊", weight:8 },
  { id:"momentum",    name:"Momentum",             desc:"RSI-Näherung & Tagesperformance in Trendrichtung", icon:"⚡", weight:7 },
  { id:"cot",         name:"COT-Daten",            desc:"Manuell: Commercials bauen Long-Position auf",     icon:"🏦", weight:9 },
  { id:"macro",       name:"Makro-Filter",         desc:"Zinskurve & Wirtschaftszyklus positiv",            icon:"🌍", weight:7 },
  { id:"intermarket", name:"Intermarket",          desc:"Korrelierte Märkte bestätigen die Richtung",       icon:"🔗", weight:6 },
  { id:"stacking",    name:"Saisonalität stapeln", desc:"Mehrere Saisonmuster gleichzeitig aktiv",          icon:"🗂️", weight:5 },
];

const MONTHS = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];

const GUIDE_STEPS = [
  { step:1, title:"Monatlich – Saisonales Fenster prüfen", icon:"📅", color:"#1d6ed8", desc:"Schau jeden Monatsbeginn im Dashboard welche Trades im nächsten Monat aktiv werden. Das ist deine Vorschau-Liste. Noch nicht handeln – nur auf die Watchlist nehmen.", tip:"💡 Nutze den Kalender-Tab um mehrere Monate vorauszuplanen." },
  { step:2, title:"Wöchentlich – Filter prüfen",           icon:"🔍", color:"#d97706", desc:"In der Woche bevor das saisonale Fenster öffnet: COT-Daten (freitags auf cotbase.com), 200-MA und Makrolage checken. Die App lädt Live-Daten für Trend, Momentum, Makro und Intermarket automatisch.", tip:"💡 Mindestens 3 von 6 Filter sollten grün sein bevor du weiterplanst." },
  { step:3, title:"Täglich – Einstiegssignal abwarten",    icon:"⚡", color:"#059669", desc:"Erst wenn das saisonale Fenster offen ist UND die Live-Filter grün zeigen, planst du den konkreten Einstieg. Nie am ersten Tag des Fensters blind einsteigen.", tip:"💡 Setze eine Kursbenachrichtigung bei deinem Broker für den relevanten Bereich." },
  { step:4, title:"Position gestaffelt aufbauen",          icon:"🏗️", color:"#d97706", desc:"Steige mit 50% deiner geplanten Position ein. Erst wenn der Trade 2–3% läuft und bestätigt ist, fügst du die restlichen 50% hinzu. Das schützt vor Fehlausbrüchen.", tip:"💡 Berechne deine Positionsgröße vorher im Stop-Rechner Tab." },
  { step:5, title:"Stop-Loss setzen – sofort!",            icon:"🛡️", color:"#dc2626", desc:"Direkt beim Einstieg den Stop-Loss setzen – nicht erst später. Nutze die empfohlenen Stop-Werte aus dem Rechner. Bei +5% Gewinn: Stop auf Break-even nachziehen.", tip:"💡 Riskiere nie mehr als 1–2% deines Gesamtkapitals pro Trade." },
  { step:6, title:"Trailing Stop – Gewinne sichern",       icon:"🎯", color:"#7c3aed", desc:"Sobald der Trade gut läuft, Stop schrittweise nachziehen. Bei Erreichen des saisonalen Fensterendes: Position teilweise oder ganz schließen, auch ohne Stop.", tip:"💡 Das Ende des saisonalen Fensters ist ein natürlicher Exit-Trigger." },
];

const MISTAKES = [
  "Zu früh einsteigen – am ersten Tag des Fensters blind kaufen",
  "Kein Stop-Loss setzen oder ihn zu eng wählen (< 1× ATR)",
  "Zu große Position – mehr als 2% Risiko pro Trade",
  "Saisonalität alleine nutzen ohne Filterbestätigung",
  "Stop-Loss nicht nachziehen wenn der Trade läuft",
  "Bei Rohstoffen (Erdgas!) mit zu engem Stop handeln",
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function isTradeActive(trade, m) {
  const { startMonth: s, endMonth: e } = trade;
  return s <= e ? m >= s && m <= e : m >= s || m <= e;
}

function calcHitRate(base, manualFilters, liveFilters) {
  const WEIGHTS = { trend:8, momentum:5, cot:4, macro:3, intermarket:2, stacking:3 };
  let bonus = 0;
  for (const [key, w] of Object.entries(WEIGHTS)) {
    // COT and stacking are always manual
    if (key === "cot" || key === "stacking") {
      if (manualFilters[key]) bonus += w;
    } else {
      // Use live if available, else fall back to manual
      const live = liveFilters?.[key];
      if (live != null ? live : manualFilters[key]) bonus += w;
    }
  }
  return Math.min(97, base + bonus);
}

function hitColor(v) {
  return v >= 88 ? "#059669" : v >= 82 ? "#d97706" : v >= 75 ? "#ea580c" : "#dc2626";
}

function fmtTime(isoStr) {
  if (!isoStr) return "–";
  try {
    return new Date(isoStr).toLocaleTimeString("de-DE", { hour:"2-digit", minute:"2-digit" });
  } catch { return "–"; }
}

function fmtDateTime(isoStr) {
  if (!isoStr) return "–";
  try {
    return new Date(isoStr).toLocaleString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
  } catch { return "–"; }
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:"#f0f4f8", surface:"#ffffff", surfaceAlt:"#f8fafc",
  border:"#cbd5e1", borderStrong:"#94a3b8",
  text:"#0f172a", textSub:"#475569", textMuted:"#94a3b8",
  blue:"#1d6ed8", blueLight:"#dbeafe",
  green:"#059669", greenLight:"#d1fae5",
  yellow:"#d97706", yellowLight:"#fef3c7",
  orange:"#ea580c", orangeLight:"#ffedd5",
  red:"#dc2626", redLight:"#fee2e2",
  purple:"#7c3aed", purpleLight:"#ede9fe",
};

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────
function HitRateBar({ value, base }) {
  const c = hitColor(value);
  return (
    <div style={{ position:"relative", height:8, background:T.border, borderRadius:99, overflow:"hidden", marginTop:6 }}>
      <div style={{ position:"absolute", inset:0, width:`${base}%`, background:T.borderStrong }} />
      <div style={{ position:"absolute", inset:0, width:`${value}%`, background:c, transition:"width .5s ease", borderRadius:99 }} />
    </div>
  );
}

function Badge({ children, color, bg }) {
  return <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:99, background:bg, color, letterSpacing:.5 }}>{children}</span>;
}

function SectionLabel({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, letterSpacing:2, color:T.textMuted, marginBottom:10, textTransform:"uppercase" }}>{children}</div>;
}

function Card({ children, style={} }) {
  return <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:16, padding:20, ...style }}>{children}</div>;
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"#00000066", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:20, padding:28, maxWidth:680, width:"100%", maxHeight:"90vh", overflowY:"auto", position:"relative", boxShadow:"0 24px 60px #0003" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:T.surfaceAlt, border:`1px solid ${T.border}`, color:T.textSub, borderRadius:10, width:34, height:34, cursor:"pointer", fontSize:16, fontWeight:700 }}>✕</button>
        {children}
      </div>
    </div>
  );
}

// Live-Daten Status Pill
function LivePill({ loading, error, fetchedAt, onRefresh }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, background: error ? T.redLight : loading ? T.yellowLight : T.greenLight, border:`1px solid ${error ? T.red+"44" : loading ? T.yellow+"44" : T.green+"44"}`, borderRadius:99, padding:"5px 12px", fontSize:12 }}>
      <div style={{ width:7, height:7, borderRadius:"50%", background: error ? T.red : loading ? T.yellow : T.green, animation: loading ? "pulse 1s infinite" : "none" }} />
      <span style={{ fontWeight:600, color: error ? T.red : loading ? T.yellow : T.green }}>
        {loading ? "Lädt..." : error ? "Fehler" : "Live"}
      </span>
      {fetchedAt && !loading && (
        <span style={{ color:T.textMuted, fontSize:11 }}>Stand: {fmtDateTime(fetchedAt)}</span>
      )}
      <button onClick={onRefresh} disabled={loading} style={{ background:"none", border:"none", cursor:loading?"default":"pointer", fontSize:14, padding:0, lineHeight:1, color:T.textSub }} title="Aktualisieren">🔄</button>
    </div>
  );
}

// Filter-Zeile: zeigt ob live oder manuell + Detail-Info
function FilterRow({ filterId, label, icon, weight, liveData, manualVal, onToggleManual, tradeId }) {
  const isManual = filterId === "cot" || filterId === "stacking";
  const liveResult = liveData?.tradeFilters?.[tradeId]?.[filterId];
  const hasLive = !isManual && liveResult != null;
  const met = hasLive ? liveResult.met : manualVal;

  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"9px 12px", borderRadius:10, background: met ? T.greenLight : T.surfaceAlt, border:`1px solid ${met ? T.green+"44" : T.border}`, marginBottom:6 }}>
      <div style={{ width:8, height:8, borderRadius:"50%", flexShrink:0, marginTop:4, background: met ? T.green : T.borderStrong }} />
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
          <span style={{ fontSize:13, fontWeight:600, color: met ? "#065f46" : T.textSub }}>{label}</span>
          {hasLive
            ? <Badge color={T.blue} bg={T.blueLight}>LIVE</Badge>
            : <Badge color={T.textMuted} bg={T.surfaceAlt}>MANUELL</Badge>
          }
          <span style={{ fontSize:11, color:T.textMuted, marginLeft:"auto" }}>+{weight}%</span>
        </div>
        {hasLive && liveResult.detail && (
          <div style={{ fontSize:11, color:T.textSub, lineHeight:1.5 }}>{liveResult.detail}</div>
        )}
        {isManual && (
          <button onClick={() => onToggleManual(filterId)} style={{
            marginTop:4, fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:99, cursor:"pointer",
            background: manualVal ? T.green : T.surface, color: manualVal ? "#fff" : T.textSub,
            border:`1px solid ${manualVal ? T.green : T.border}`,
          }}>
            {filterId === "cot" ? "COT manuell geprüft ✓" : "Saisonalität gestapelt ✓"} {manualVal ? "— aktiv" : "— nicht aktiv"}
          </button>
        )}
      </div>
      <div style={{ fontSize:16 }}>{met ? "✅" : "○"}</div>
    </div>
  );
}

function TradeCard({ trade, manualFilters, liveData, onToggleManual, onClick, isExpanded, inactive }) {
  const isLong = trade.direction === "LONG";
  const dc = isLong ? T.green : T.red;
  const dcLight = isLong ? T.greenLight : T.redLight;

  // Build effective filter booleans (live where possible)
  const effectiveFilters = {};
  for (const f of FILTERS) {
    const liveResult = liveData?.tradeFilters?.[trade.id]?.[f.id];
    const hasLive = f.id !== "cot" && f.id !== "stacking" && liveResult != null;
    effectiveFilters[f.id] = hasLive ? liveResult.met : manualFilters[f.id];
  }
  const hitRate = calcHitRate(trade.baseHitRate, manualFilters, liveData?.tradeFilters?.[trade.id]);
  const met = Object.values(effectiveFilters).filter(Boolean).length;

  const signalText = hitRate >= 88 ? "🟢 Starkes Signal – alle wichtigen Filter erfüllt"
    : hitRate >= 82 ? "🟡 Gutes Signal – weitere Filter empfohlen"
    : hitRate >= 75 ? "🟠 Mittleres Signal – saisonales Fenster offen"
    : "🔴 Schwaches Signal – erst bei Filterbestätigung handeln";

  return (
    <div onClick={onClick} style={{
      background: inactive ? T.surfaceAlt : T.surface,
      border:`1px solid ${inactive ? T.border : T.borderStrong}`,
      borderLeft:`4px solid ${inactive ? T.border : dc}`,
      borderRadius:14, padding:"16px 18px", marginBottom:10,
      cursor:"pointer", opacity: inactive ? 0.55 : 1,
      boxShadow: isExpanded ? "0 4px 20px #0001" : "none",
      transition:"box-shadow .15s",
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <span style={{ fontSize:24 }}>{trade.icon}</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:2 }}>
            <span style={{ fontSize:15, fontWeight:700, color:T.text }}>{trade.name}</span>
            <Badge color={dc} bg={dcLight}>{trade.direction}</Badge>
            <span style={{ fontSize:12, color:T.textSub }}>{trade.sector}</span>
            <span style={{ fontSize:12, color:T.red, fontWeight:600 }}>Stop –{trade.stopLoss}%</span>
          </div>
          <HitRateBar value={hitRate} base={trade.baseHitRate} />
        </div>
        <div style={{ textAlign:"right", minWidth:68, flexShrink:0 }}>
          <div style={{ fontSize:22, fontWeight:800, color:hitColor(hitRate), lineHeight:1 }}>{hitRate}%</div>
          <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>Ø {trade.avgGain}</div>
        </div>
        <div style={{ fontSize:18, color:T.borderStrong, marginLeft:2 }}>{isExpanded ? "▲" : "▼"}</div>
      </div>

      {/* Filter dots */}
      <div style={{ display:"flex", gap:6, marginTop:10, alignItems:"center", flexWrap:"wrap" }}>
        {FILTERS.map(f => {
          const isLive = f.id !== "cot" && f.id !== "stacking" && liveData?.tradeFilters?.[trade.id]?.[f.id] != null;
          return (
            <div key={f.id} title={`${f.name}${isLive ? " (Live)" : " (Manuell)"}`} style={{
              width:9, height:9, borderRadius:"50%",
              background: effectiveFilters[f.id] ? dc : T.border,
              border:`1.5px solid ${isLive ? T.blue : "transparent"}`,
              transition:"background .2s",
            }} />
          );
        })}
        <span style={{ fontSize:12, color:T.textSub, marginLeft:4, fontWeight:600 }}>{met}/6</span>
        {liveData && <Badge color={T.blue} bg={T.blueLight}>Live-Daten aktiv</Badge>}
      </div>

      {isExpanded && (
        <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
          <div style={{ fontSize:13, color:T.blue, marginBottom:12, fontWeight:500 }}>💡 {trade.fundamentalDriver}</div>

          {/* Filter detail rows */}
          {FILTERS.map(f => (
            <FilterRow
              key={f.id}
              filterId={f.id}
              label={f.name}
              icon={f.icon}
              weight={f.weight}
              liveData={liveData}
              manualVal={manualFilters[f.id]}
              onToggleManual={onToggleManual}
              tradeId={trade.id}
            />
          ))}

          {/* Signal verdict */}
          <div style={{ marginTop:12, padding:"10px 14px", borderRadius:10, background: hitRate >= 85 ? T.greenLight : T.yellowLight, border:`1px solid ${hitRate >= 85 ? T.green+"55" : T.yellow+"55"}` }}>
            <span style={{ fontSize:13, fontWeight:600, color: hitRate >= 85 ? "#065f46" : "#92400e" }}>{signalText}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const now = new Date();
  const [month, setMonth]           = useState(now.getMonth() + 1);
  const [manualFilters, setManualFilters] = useState({ trend:false, momentum:false, cot:false, macro:false, intermarket:false, stacking:false });
  const [expanded, setExpanded]     = useState(null);
  const [tab, setTab]               = useState("dashboard");
  const [showGuide, setShowGuide]   = useState(false);
  const [guideStep, setGuideStep]   = useState(0);
  const [capital, setCapital]       = useState(10000);
  const [riskPct, setRiskPct]       = useState(1);
  const [calcId, setCalcId]         = useState(1);
  const [customStop, setCustomStop] = useState(null);

  // Live data state
  const [liveData, setLiveData]     = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError]   = useState(null);
  const [fetchedAt, setFetchedAt]   = useState(null);

  const toggleManual = id => setManualFilters(f => ({ ...f, [id]: !f[id] }));

  // ── Fetch live data ──────────────────────────────────────────────────────
  // Tries /api/marketdata (Vercel) first, falls back to direct Yahoo Finance
  const fetchLive = useCallback(async () => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      // Try Vercel API first
      let data = null;
      try {
        const res = await fetch("/api/marketdata");
        if (res.ok) { data = await res.json(); }
      } catch (_) {}

      // Fallback: fetch directly from Yahoo Finance via public CORS proxy
      if (!data) {
        const symbols = ["^GSPC","^IXIC","GC=F","CL=F","NG=F","HG=F","SB=F","DX-Y.NYB","GBPJPY=X","AUDJPY=X"];
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(","))}&fields=regularMarketPrice,regularMarketChangePercent,twoHundredDayAverage,regularMarketTime`;
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const quotes = json?.quoteResponse?.result ?? [];

        const symMap = { "^GSPC":"sp500","^IXIC":"nasdaq","GC=F":"gold","CL=F":"oil","NG=F":"gas","HG=F":"copper","SB=F":"sugar","DX-Y.NYB":"usd","GBPJPY=X":"gbpjpy","AUDJPY=X":"audjpy" };
        const q = {};
        for (const quote of quotes) {
          const key = symMap[quote.symbol];
          if (key) q[key] = quote;
        }

        function ma200(quote) {
          if (!quote) return null;
          const price = quote.regularMarketPrice, ma = quote.twoHundredDayAverage;
          if (!price || !ma) return null;
          return { price:+price.toFixed(2), ma200:+ma.toFixed(2), above: price > ma, pctDiff:+(((price-ma)/ma)*100).toFixed(2) };
        }

        const sp500ma = ma200(q.sp500), nasdaqma = ma200(q.nasdaq), goldma = ma200(q.gold);
        const oilma = ma200(q.oil), gasma = ma200(q.gas), copperma = ma200(q.copper), sugarma = ma200(q.sugar);
        const usdChg = q.usd?.regularMarketChangePercent ?? 0;

        const tf = {
          1:  { trend: sp500ma  ? { met:sp500ma.above,  detail:`S&P 200-MA: ${sp500ma.price} vs MA ${sp500ma.ma200} (${sp500ma.pctDiff>0?"+":""}${sp500ma.pctDiff}%)` } : null, momentum: q.sp500 ? { met:(q.sp500.regularMarketChangePercent??0)>-1, detail:`S&P Tageschange: ${(q.sp500.regularMarketChangePercent??0).toFixed(2)}%` } : null, intermarket: { met: usdChg < 0.5, detail:`USD Change: ${usdChg.toFixed(2)}% (schwacher USD = bullisch)` } },
          2:  { trend: gasma    ? { met:gasma.above,    detail:`Erdgas 200-MA: ${gasma.price} vs MA ${gasma.ma200} (${gasma.pctDiff>0?"+":""}${gasma.pctDiff}%)` } : null, momentum: q.gas ? { met:(q.gas.regularMarketChangePercent??0)>0, detail:`Erdgas Tageschange: ${(q.gas.regularMarketChangePercent??0).toFixed(2)}%` } : null, intermarket: oilma ? { met:oilma.above, detail:`Rohöl über 200-MA: ${oilma.above?"ja ✓":"nein ✗"}` } : null },
          3:  { trend: goldma   ? { met:goldma.above,   detail:`Gold 200-MA: ${goldma.price} vs MA ${goldma.ma200} (${goldma.pctDiff>0?"+":""}${goldma.pctDiff}%)` } : null, momentum: q.gold ? { met:(q.gold.regularMarketChangePercent??0)>0, detail:`Gold Tageschange: ${(q.gold.regularMarketChangePercent??0).toFixed(2)}%` } : null, intermarket: { met: usdChg < 0, detail:`USD fällt: ${usdChg<0?"ja ✓":"nein ✗"} (bullisch für Gold)` } },
          4:  { trend: oilma    ? { met:oilma.above,    detail:`Öl 200-MA: ${oilma.price} vs MA ${oilma.ma200} (${oilma.pctDiff>0?"+":""}${oilma.pctDiff}%)` } : null, momentum: q.oil ? { met:(q.oil.regularMarketChangePercent??0)>0, detail:`Öl Tageschange: ${(q.oil.regularMarketChangePercent??0).toFixed(2)}%` } : null, intermarket: gasma ? { met:gasma.above, detail:`Erdgas über 200-MA: ${gasma.above?"ja ✓":"nein ✗"}` } : null },
          5:  { trend: sp500ma  ? { met:sp500ma.above,  detail:`S&P 200-MA: ${sp500ma.above?"darüber ✓":"darunter ✗"} (${sp500ma.pctDiff>0?"+":""}${sp500ma.pctDiff}%)` } : null, intermarket: nasdaqma ? { met:nasdaqma.above, detail:`Nasdaq über 200-MA: ${nasdaqma.above?"ja ✓":"nein ✗"}` } : null },
          6:  { trend: q.gbpjpy ? { met:(q.gbpjpy.regularMarketChangePercent??0)<0, detail:`GBP/JPY Tageschange: ${(q.gbpjpy.regularMarketChangePercent??0).toFixed(2)}%` } : null, intermarket: q.audjpy ? { met:(q.audjpy.regularMarketChangePercent??0)<0, detail:`AUD/JPY auch fallend: ${(q.audjpy.regularMarketChangePercent??0)<0?"ja ✓":"nein ✗"}` } : null },
          7:  { trend: q.audjpy ? { met:(q.audjpy.regularMarketChangePercent??0)<0, detail:`AUD/JPY Tageschange: ${(q.audjpy.regularMarketChangePercent??0).toFixed(2)}%` } : null, intermarket: q.gbpjpy ? { met:(q.gbpjpy.regularMarketChangePercent??0)<0, detail:`GBP/JPY auch fallend: ${(q.gbpjpy.regularMarketChangePercent??0)<0?"ja ✓":"nein ✗"}` } : null },
          8:  { trend: sugarma  ? { met:!sugarma.above, detail:`Zucker 200-MA: Kurs ${sugarma.above?"darüber (bärisch)":"darunter ✓"}` } : null, momentum: q.sugar ? { met:(q.sugar.regularMarketChangePercent??0)<0, detail:`Zucker Tageschange: ${(q.sugar.regularMarketChangePercent??0).toFixed(2)}%` } : null },
          9:  { trend: copperma ? { met:copperma.above, detail:`Kupfer 200-MA: ${copperma.price} vs MA ${copperma.ma200} (${copperma.pctDiff>0?"+":""}${copperma.pctDiff}%)` } : null, momentum: q.copper ? { met:(q.copper.regularMarketChangePercent??0)>0, detail:`Kupfer Tageschange: ${(q.copper.regularMarketChangePercent??0).toFixed(2)}%` } : null, intermarket: sp500ma ? { met:sp500ma.above, detail:`S&P über 200-MA: ${sp500ma.above?"ja ✓":"nein ✗"}` } : null },
          10: { trend: nasdaqma ? { met:nasdaqma.above, detail:`Nasdaq 200-MA: ${nasdaqma.price} vs MA ${nasdaqma.ma200} (${nasdaqma.pctDiff>0?"+":""}${nasdaqma.pctDiff}%)` } : null, momentum: q.nasdaq ? { met:(q.nasdaq.regularMarketChangePercent??0)>-0.5, detail:`Nasdaq Tageschange: ${(q.nasdaq.regularMarketChangePercent??0).toFixed(2)}%` } : null, intermarket: sp500ma ? { met:sp500ma.above, detail:`S&P über 200-MA: ${sp500ma.above?"ja ✓":"nein ✗"}` } : null },
        };

        const prices = {};
        for (const [key, quote] of Object.entries(q)) {
          prices[key] = { price:quote.regularMarketPrice?+quote.regularMarketPrice.toFixed(2):null, change:quote.regularMarketChangePercent?+quote.regularMarketChangePercent.toFixed(2):null, time:quote.regularMarketTime?new Date(quote.regularMarketTime*1000).toISOString():null };
        }

        data = { fetchedAt: new Date().toISOString(), prices, yieldCurve: null, fedFunds: null, tradeFilters: tf, source: "direct" };
      }

      setLiveData(data);
      setFetchedAt(data.fetchedAt);
    } catch (err) {
      setLiveError(err.message);
    } finally {
      setLiveLoading(false);
    }
  }, []);

  // Fetch on mount + every 15 minutes
  useEffect(() => {
    fetchLive();
    const timer = setInterval(fetchLive, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, [fetchLive]);

  const activeFiltersCount = Object.values(manualFilters).filter(Boolean).length;
  const active   = TRADES.filter(t =>  isTradeActive(t, month));
  const inactive = TRADES.filter(t => !isTradeActive(t, month));
  const nextMonth = month === 12 ? 1 : month + 1;
  const upcoming  = TRADES.filter(t => isTradeActive(t, nextMonth) && !isTradeActive(t, month));

  const ct      = TRADES.find(t => t.id === calcId);
  const stopPct = customStop ?? ct.stopLoss;
  const maxRisk = (capital * riskPct) / 100;
  const posSize = Math.round(maxRisk / (stopPct / 100));
  const posPct  = ((posSize / capital) * 100).toFixed(1);

  // Compute avg hit rate for active trades (using live data)
  const avgHit = active.length
    ? Math.round(active.reduce((s,t) => s + calcHitRate(t.baseHitRate, manualFilters, liveData?.tradeFilters?.[t.id]), 0) / active.length)
    : 0;

  const TABS = [["dashboard","Dashboard"],["live","Live-Daten"],["rechner","Stop-Rechner"],["timeline","Kalender"]];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif", paddingBottom:60 }}>

      {/* ── GUIDE MODAL ── */}
      <Modal open={showGuide} onClose={() => setShowGuide(false)}>
        <SectionLabel>Anfänger-Leitfaden</SectionLabel>
        <div style={{ fontSize:22, fontWeight:800, color:T.text, marginBottom:18 }}>Schritt-für-Schritt Vorgehensweise</div>
        <div style={{ display:"flex", gap:6, marginBottom:18, flexWrap:"wrap" }}>
          {GUIDE_STEPS.map((s, i) => (
            <button key={i} onClick={() => setGuideStep(i)} style={{ background: guideStep===i ? s.color : T.surfaceAlt, border:`1px solid ${guideStep===i ? s.color : T.border}`, color: guideStep===i ? "#fff" : T.textSub, borderRadius:99, padding:"6px 14px", cursor:"pointer", fontSize:13, fontWeight:600 }}>
              Schritt {s.step}
            </button>
          ))}
        </div>
        {(() => { const s = GUIDE_STEPS[guideStep]; return (
          <div style={{ background:T.surfaceAlt, border:`2px solid ${s.color}33`, borderLeft:`4px solid ${s.color}`, borderRadius:14, padding:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <span style={{ fontSize:30 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize:11, color:s.color, fontWeight:700, letterSpacing:1 }}>SCHRITT {s.step} VON 6</div>
                <div style={{ fontSize:17, fontWeight:700, color:T.text }}>{s.title}</div>
              </div>
            </div>
            <div style={{ fontSize:14, color:T.textSub, lineHeight:1.7, marginBottom:12 }}>{s.desc}</div>
            <div style={{ fontSize:13, color:s.color, background:s.color+"14", padding:"10px 14px", borderRadius:10, fontWeight:500 }}>{s.tip}</div>
          </div>
        ); })()}
        <div style={{ display:"flex", gap:10, marginTop:16 }}>
          <button onClick={() => setGuideStep(Math.max(0,guideStep-1))} disabled={guideStep===0} style={{ flex:1, padding:11, background:T.surfaceAlt, border:`1px solid ${T.border}`, color:guideStep===0?T.textMuted:T.blue, borderRadius:10, cursor:guideStep===0?"default":"pointer", fontSize:14, fontWeight:600 }}>← Zurück</button>
          <button onClick={() => setGuideStep(Math.min(5,guideStep+1))} disabled={guideStep===5} style={{ flex:1, padding:11, background:guideStep<5?T.blue:T.surfaceAlt, border:`1px solid ${guideStep<5?T.blue:T.border}`, color:guideStep<5?"#fff":T.textMuted, borderRadius:10, cursor:guideStep<5?"pointer":"default", fontSize:14, fontWeight:600 }}>Weiter →</button>
        </div>
        <div style={{ marginTop:24, borderTop:`1px solid ${T.border}`, paddingTop:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.red, marginBottom:12 }}>⚠ Häufige Anfängerfehler</div>
          {MISTAKES.map((m,i) => <div key={i} style={{ fontSize:13, color:T.textSub, marginBottom:8, display:"flex", gap:10, lineHeight:1.5 }}><span>❌</span><span>{m}</span></div>)}
        </div>
      </Modal>

      {/* ── HEADER ── */}
      <div style={{ background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"20px 20px 0", boxShadow:"0 1px 4px #0000000a" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10, flexWrap:"wrap" }}>
            <span style={{ fontSize:28 }}>📉📈</span>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:T.textMuted }}>SAISONALER TRADE OPTIMIZER</div>
              <div style={{ fontSize:22, fontWeight:800, color:T.text }}>Signal Dashboard</div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <LivePill loading={liveLoading} error={liveError} fetchedAt={fetchedAt} onRefresh={fetchLive} />
              <button onClick={() => { setShowGuide(true); setGuideStep(0); }} style={{ background:T.blueLight, border:`1px solid ${T.blue}44`, color:T.blue, borderRadius:10, padding:"8px 14px", cursor:"pointer", fontSize:13, fontWeight:600 }}>📖 Guide</button>
              <div>
                <div style={{ fontSize:11, color:T.textMuted, marginBottom:2, fontWeight:600 }}>MONAT</div>
                <select value={month} onChange={e => setMonth(+e.target.value)} style={{ background:T.surfaceAlt, color:T.text, border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 10px", fontSize:14, cursor:"pointer", fontWeight:600 }}>
                  {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:0 }}>
            {TABS.map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{ background:"transparent", color:tab===key?T.blue:T.textSub, border:"none", borderBottom:`3px solid ${tab===key?T.blue:"transparent"}`, padding:"10px 18px", cursor:"pointer", fontSize:13, fontWeight:700, transition:"all .15s" }}>
                {key==="live" && liveData ? `${label} ✓` : label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding:"22px 16px 0" }}>

        {/* ── DASHBOARD ── */}
        {tab === "dashboard" && <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:22 }}>
            {[
              { label:"Aktive Trades", val:active.length,           color:T.green,  bg:T.greenLight,  icon:"✅" },
              { label:"Filter (Live)", val:`${activeFiltersCount}/6`, color:T.blue,   bg:T.blueLight,   icon:"🎯" },
              { label:"Ø Hit-Rate",    val:`${avgHit}%`,             color:T.yellow, bg:T.yellowLight, icon:"📊" },
            ].map(s => (
              <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.color}33`, borderRadius:14, padding:"16px 18px" }}>
                <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
                <div style={{ fontSize:28, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:11, fontWeight:700, color:s.color, letterSpacing:1, marginTop:4 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>

          {/* Makro-Schnellinfo */}
          {liveData && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:20 }}>
              <div style={{ background: (liveData.yieldCurve ?? 0) > -0.5 ? T.greenLight : T.redLight, border:`1px solid ${(liveData.yieldCurve ?? 0) > -0.5 ? T.green+"44" : T.red+"44"}`, borderRadius:12, padding:"12px 16px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, marginBottom:4 }}>ZINSKURVE (10J–2J)</div>
                <div style={{ fontSize:22, fontWeight:800, color:(liveData.yieldCurve ?? 0) > -0.5 ? T.green : T.red }}>{liveData.yieldCurve != null ? `${liveData.yieldCurve > 0 ? "+" : ""}${liveData.yieldCurve}%` : "–"}</div>
                <div style={{ fontSize:11, color:T.textSub }}>{(liveData.yieldCurve ?? 0) > -0.5 ? "Normal – Makro OK ✓" : "Invertiert – Vorsicht ✗"}</div>
              </div>
              <div style={{ background:T.surfaceAlt, border:`1px solid ${T.border}`, borderRadius:12, padding:"12px 16px" }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.textMuted, marginBottom:4 }}>FED FUNDS RATE</div>
                <div style={{ fontSize:22, fontWeight:800, color:T.text }}>{liveData.fedFunds != null ? `${liveData.fedFunds}%` : "–"}</div>
                <div style={{ fontSize:11, color:T.textSub }}>Aktueller Leitzins USA</div>
              </div>
            </div>
          )}

          <SectionLabel>▶ Aktive Trades – {MONTHS[month-1]}</SectionLabel>
          {active.length === 0 && <div style={{ padding:24, textAlign:"center", color:T.textMuted, border:`1px dashed ${T.border}`, borderRadius:14, fontSize:14 }}>Keine aktiven saisonalen Trades in diesem Monat.</div>}
          {active.map(t => (
            <TradeCard key={t.id} trade={t} manualFilters={manualFilters} liveData={liveData}
              onToggleManual={toggleManual}
              onClick={() => setExpanded(expanded===t.id ? null : t.id)} isExpanded={expanded===t.id} />
          ))}

          {inactive.length > 0 && <>
            <div style={{ marginTop:28, marginBottom:10 }}><SectionLabel>▸ Inaktive Trades (Beobachtung)</SectionLabel></div>
            {inactive.map(t => (
              <TradeCard key={t.id} trade={t} manualFilters={manualFilters} liveData={liveData}
                onToggleManual={toggleManual} inactive
                onClick={() => setExpanded(expanded===t.id ? null : t.id)} isExpanded={expanded===t.id} />
            ))}
          </>}
        </>}

        {/* ── LIVE-DATEN TAB ── */}
        {tab === "live" && <>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <SectionLabel>▶ Live Marktdaten & Filter-Status</SectionLabel>
            <LivePill loading={liveLoading} error={liveError} fetchedAt={fetchedAt} onRefresh={fetchLive} />
          </div>

          {liveError && (
            <div style={{ background:T.redLight, border:`1px solid ${T.red}44`, borderRadius:12, padding:16, marginBottom:16, fontSize:13, color:T.red }}>
              ⚠ Fehler beim Laden der Live-Daten: {liveError}. Die App funktioniert weiterhin mit manuellen Filtern.
            </div>
          )}

          {/* Preistabelle */}
          {liveData?.prices && (
            <Card style={{ marginBottom:16 }}>
              <SectionLabel>Aktuelle Kurse</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8 }}>
                {[
                  ["sp500","S&P 500"],["nasdaq","Nasdaq"],["gold","Gold"],["oil","Rohöl"],
                  ["gas","Erdgas"],["copper","Kupfer"],["sugar","Zucker"],["gbpjpy","GBP/JPY"],["audjpy","AUD/JPY"],["usd","USD-Index"],
                ].map(([key, label]) => {
                  const p = liveData.prices[key];
                  if (!p) return null;
                  const up = (p.change ?? 0) >= 0;
                  return (
                    <div key={key} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:T.surfaceAlt, borderRadius:10, border:`1px solid ${T.border}` }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:T.textSub }}>{label}</div>
                        <div style={{ fontSize:18, fontWeight:800, color:T.text }}>{p.price?.toLocaleString("de-DE") ?? "–"}</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:13, fontWeight:700, color: up ? T.green : T.red }}>{up ? "+" : ""}{p.change?.toFixed(2)}%</div>
                        {p.time && <div style={{ fontSize:10, color:T.textMuted }}>Stand {fmtTime(p.time)}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Live-Filter Übersicht */}
          <Card>
            <SectionLabel>Live-Filter Auswertung – alle Trades</SectionLabel>
            <div style={{ fontSize:12, color:T.textSub, marginBottom:14, lineHeight:1.6 }}>
              🔵 <strong>LIVE</strong> = automatisch geprüft via Yahoo Finance & FRED&nbsp;&nbsp;|&nbsp;&nbsp;
              ⚪ <strong>MANUELL</strong> = von dir selbst zu prüfen (COT, Saisonalitäts-Stacking)
            </div>
            {TRADES.map(t => {
              const tf = liveData?.tradeFilters?.[t.id] ?? {};
              const hitRate = calcHitRate(t.baseHitRate, manualFilters, tf);
              return (
                <div key={t.id} style={{ marginBottom:16, padding:14, background:T.surfaceAlt, borderRadius:12, border:`1px solid ${T.border}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <span style={{ fontSize:20 }}>{t.icon}</span>
                    <span style={{ fontSize:14, fontWeight:700, color:T.text }}>{t.name}</span>
                    <Badge color={t.direction==="LONG"?T.green:T.red} bg={t.direction==="LONG"?T.greenLight:T.redLight}>{t.direction}</Badge>
                    <div style={{ marginLeft:"auto", fontSize:20, fontWeight:800, color:hitColor(hitRate) }}>{hitRate}%</div>
                  </div>
                  {FILTERS.map(f => {
                    const liveResult = tf[f.id];
                    const isManualFilter = f.id === "cot" || f.id === "stacking";
                    const hasLive = !isManualFilter && liveResult != null;
                    const met = hasLive ? liveResult.met : manualFilters[f.id];
                    return (
                      <div key={f.id} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"7px 10px", borderRadius:8, background: met ? T.greenLight : T.surface, border:`1px solid ${met ? T.green+"33" : T.border}`, marginBottom:5 }}>
                        <span style={{ fontSize:14, marginTop:1 }}>{met ? "✅" : "○"}</span>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                            <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{f.name}</span>
                            {hasLive ? <Badge color={T.blue} bg={T.blueLight}>LIVE</Badge> : <Badge color={T.textMuted} bg={T.surfaceAlt}>MANUELL</Badge>}
                          </div>
                          {hasLive && liveResult.detail && <div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>{liveResult.detail}</div>}
                          {isManualFilter && (
                            <button onClick={() => toggleManual(f.id)} style={{ marginTop:4, fontSize:11, padding:"2px 9px", borderRadius:99, cursor:"pointer", background:manualFilters[f.id]?T.green:T.surface, color:manualFilters[f.id]?"#fff":T.textSub, border:`1px solid ${manualFilters[f.id]?T.green:T.border}`, fontWeight:600 }}>
                              {manualFilters[f.id] ? "✓ Aktiv – klicken zum Deaktivieren" : "Manuell aktivieren"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </Card>

          {/* Datenquellen Info */}
          <div style={{ marginTop:16, background:T.blueLight, border:`1px solid ${T.blue}33`, borderRadius:12, padding:16, fontSize:12, color:T.textSub, lineHeight:1.7 }}>
            <strong style={{ color:T.blue }}>📡 Datenquellen:</strong><br />
            <strong>Yahoo Finance</strong> – Kurse, 200-MA, Tagesperformance (ca. 15 Min. verzögert)<br />
            <strong>FRED (Federal Reserve)</strong> – Zinskurve 10J–2J, Fed Funds Rate (täglich aktualisiert)<br />
            <strong>COT-Daten & Saisonalitäts-Stacking</strong> – manuell auf <a href="https://cotbase.com" target="_blank" rel="noreferrer" style={{ color:T.blue }}>cotbase.com</a> prüfen<br />
            <strong>Auto-Refresh:</strong> alle 15 Minuten
          </div>
        </>}

        {/* ── STOP RECHNER ── */}
        {tab === "rechner" && <>
          <SectionLabel>▶ Stop-Loss & Positionsgrössen-Rechner</SectionLabel>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
            <Card>
              <SectionLabel>Eingabe</SectionLabel>
              <div style={{ fontSize:12, fontWeight:700, color:T.textSub, marginBottom:4 }}>INSTRUMENT</div>
              <select value={calcId} onChange={e=>{ setCalcId(+e.target.value); setCustomStop(null); }} style={{ width:"100%", background:T.surfaceAlt, color:T.text, border:`1px solid ${T.border}`, borderRadius:9, padding:"9px 11px", fontSize:14, marginBottom:14, cursor:"pointer", fontWeight:500, boxSizing:"border-box" }}>
                {TRADES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
              </select>
              <div style={{ fontSize:12, fontWeight:700, color:T.textSub, marginBottom:4 }}>GESAMTKAPITAL (€)</div>
              <input type="number" value={capital} onChange={e=>setCapital(+e.target.value)} min={500} style={{ width:"100%", background:T.surfaceAlt, color:T.text, border:`1px solid ${T.border}`, borderRadius:9, padding:"9px 11px", fontSize:14, marginBottom:14, boxSizing:"border-box" }} />
              <div style={{ fontSize:12, fontWeight:700, color:T.textSub, marginBottom:6 }}>RISIKO PRO TRADE</div>
              <div style={{ display:"flex", gap:7, marginBottom:14 }}>
                {[0.5,1,1.5,2].map(v => (
                  <button key={v} onClick={()=>setRiskPct(v)} style={{ flex:1, padding:"9px 4px", borderRadius:9, cursor:"pointer", fontSize:13, fontWeight:700, background:riskPct===v?T.blue:T.surfaceAlt, border:`1px solid ${riskPct===v?T.blue:T.border}`, color:riskPct===v?"#fff":T.textSub }}>{v}%</button>
                ))}
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:T.textSub, marginBottom:4 }}>STOP-LOSS % <span style={{ color:T.textMuted, fontWeight:400 }}>(Standard: {ct.stopLoss}%)</span></div>
              <input type="number" value={customStop ?? ct.stopLoss} min={1} max={50} onChange={e=>setCustomStop(+e.target.value)} style={{ width:"100%", background:T.surfaceAlt, color:T.text, border:`1px solid ${T.border}`, borderRadius:9, padding:"9px 11px", fontSize:14, marginBottom:6, boxSizing:"border-box" }} />
              <div style={{ fontSize:12, color:T.textSub, marginBottom:4 }}>Volatilität: <strong style={{ color:ct.volatility==="sehr hoch"?T.red:ct.volatility==="hoch"?T.orange:T.yellow }}>{ct.volatility}</strong></div>
              <button onClick={()=>setCustomStop(null)} style={{ fontSize:12, color:T.blue, background:"none", border:"none", cursor:"pointer", padding:0, fontWeight:600 }}>↩ Standard zurücksetzen</button>
            </Card>
            <Card>
              <SectionLabel>Ergebnis</SectionLabel>
              {[
                { label:"Max. Risiko",      val:`${maxRisk.toFixed(0)} €`,                              color:T.red,   bg:T.redLight,   sub:`${riskPct}% von ${capital.toLocaleString("de-DE")} €` },
                { label:"Positionsgröße",   val:`${posSize.toLocaleString("de-DE")} €`,                color:T.blue,  bg:T.blueLight,  sub:`= ${posPct}% des Kapitals` },
                { label:"1. Einstieg 50%",  val:`${Math.round(posSize*.5).toLocaleString("de-DE")} €`, color:T.green, bg:T.greenLight, sub:"Sofort bei Signal" },
                { label:"2. Einstieg 50%",  val:`${Math.round(posSize*.5).toLocaleString("de-DE")} €`, color:T.green, bg:T.greenLight, sub:"Nach +2–3% Bestätigung" },
              ].map(r => (
                <div key={r.label} style={{ background:r.bg, border:`1px solid ${r.color}33`, borderRadius:10, padding:"12px 14px", marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:r.color, letterSpacing:1, marginBottom:3 }}>{r.label.toUpperCase()}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:r.color, lineHeight:1 }}>{r.val}</div>
                  <div style={{ fontSize:11, color:T.textMuted, marginTop:3 }}>{r.sub}</div>
                </div>
              ))}
            </Card>
          </div>
          <Card style={{ marginBottom:14 }}>
            <SectionLabel>▶ Alle Instrumente – Übersicht</SectionLabel>
            {TRADES.map(t => {
              const pos = Math.round(((capital*riskPct)/100)/(t.stopLoss/100));
              const vc  = t.volatility==="sehr hoch"?T.red:t.volatility==="hoch"?T.orange:T.yellow;
              return (
                <div key={t.id} onClick={() => { setCalcId(t.id); setCustomStop(null); }} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:7, padding:"10px 14px", background:calcId===t.id?T.blueLight:T.surfaceAlt, borderRadius:10, border:`1px solid ${calcId===t.id?T.blue+"55":T.border}`, cursor:"pointer" }}>
                  <span style={{ fontSize:18 }}>{t.icon}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:T.text, flex:1 }}>{t.name}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:vc, width:64, textAlign:"center" }}>{t.volatility}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:T.red, width:48, textAlign:"right" }}>–{t.stopLoss}%</span>
                  <span style={{ fontSize:13, fontWeight:700, color:T.blue, width:80, textAlign:"right" }}>{pos.toLocaleString("de-DE")} €</span>
                </div>
              );
            })}
            <div style={{ marginTop:10, fontSize:11, color:T.textMuted, textAlign:"right" }}>Positionsgröße bei {riskPct}% Risiko / {capital.toLocaleString("de-DE")} € Kapital</div>
          </Card>
          <div style={{ background:T.greenLight, border:`1px solid ${T.green}44`, borderRadius:14, padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.green, letterSpacing:1, marginBottom:12 }}>✅ GOLDENE REGELN</div>
            <div style={{ fontSize:14, color:"#065f46", lineHeight:1.9 }}>
              <strong>1–2% Kapitalrisiko pro Trade</strong> – Bei 5 Fehltrades gleichzeitig verlierst du max. 10% und bleibst im Spiel.<br />
              <strong>Break-even Stop</strong> – Ab +5% Gewinn: Stop auf Einstandspreis ziehen. Danach unverlierbarer Trade.<br />
              <strong>Trailing Stop</strong> – Gewinne laufen lassen, Stop schrittweise nachziehen.
            </div>
          </div>
        </>}

        {/* ── KALENDER ── */}
        {tab === "timeline" && <>
          <SectionLabel>▶ Jahreskalender – Saisonale Fenster</SectionLabel>
          <Card style={{ overflowX:"auto", padding:16 }}>
            <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:"0 4px" }}>
              <thead>
                <tr>
                  <th style={{ width:130, textAlign:"left", fontSize:11, fontWeight:700, color:T.textMuted, paddingBottom:8 }}>Instrument</th>
                  {MONTHS.map((m,i) => (
                    <th key={i} style={{ fontSize:11, fontWeight:i+1===month?800:600, color:i+1===month?T.blue:T.textMuted, paddingBottom:8, textAlign:"center", borderBottom:i+1===month?`2px solid ${T.blue}`:"2px solid transparent" }}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRADES.map(trade => (
                  <tr key={trade.id}>
                    <td style={{ fontSize:12, fontWeight:600, color:T.text, paddingRight:6, whiteSpace:"nowrap", paddingBottom:3 }}>
                      <span style={{ marginRight:5 }}>{trade.icon}</span>{trade.name}
                    </td>
                    {MONTHS.map((_,i) => {
                      const a = isTradeActive(trade, i+1);
                      const cur = i+1 === month;
                      const dc = trade.direction==="LONG"?T.green:T.red;
                      const dcl = trade.direction==="LONG"?T.greenLight:T.redLight;
                      return (
                        <td key={i} style={{ padding:"2px 2px", textAlign:"center" }}>
                          <div style={{ height:22, borderRadius:5, background:a?dcl:T.surfaceAlt, border:a?`1px solid ${dc}55`:`1px solid ${T.border}`, outline:cur&&a?`2px solid ${dc}`:"none", outlineOffset:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            {a && <div style={{ width:6, height:6, borderRadius:"50%", background:dc }} />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div style={{ marginTop:12, display:"flex", gap:18, fontSize:12 }}>
            {[[T.green,T.greenLight,"Long-Fenster"],[T.red,T.redLight,"Short-Fenster"],[T.blue,T.blueLight,"Aktueller Monat"]].map(([c,bg,l]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div style={{ width:12, height:12, borderRadius:3, background:bg, border:`1px solid ${c}66` }} />
                <span style={{ color:T.textSub, fontWeight:500 }}>{l}</span>
              </div>
            ))}
          </div>
          {upcoming.length > 0 && (
            <Card style={{ marginTop:20 }}>
              <SectionLabel>▶ Nächste öffnende Fenster – {MONTHS[nextMonth-1]}</SectionLabel>
              {upcoming.map(t => (
                <div key={t.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:T.yellowLight, borderRadius:10, border:`1px solid ${T.yellow}44`, marginBottom:8 }}>
                  <span style={{ fontSize:18 }}>{t.icon}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:T.text, flex:1 }}>{t.name}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:T.yellow }}>öffnet in {MONTHS[nextMonth-1]}</span>
                  <Badge color={t.direction==="LONG"?T.green:T.red} bg={t.direction==="LONG"?T.greenLight:T.redLight}>{t.direction}</Badge>
                  <span style={{ fontSize:13, fontWeight:700, color:hitColor(calcHitRate(t.baseHitRate, manualFilters, liveData?.tradeFilters?.[t.id])) }}>
                    {calcHitRate(t.baseHitRate, manualFilters, liveData?.tradeFilters?.[t.id])}%
                  </span>
                </div>
              ))}
            </Card>
          )}
        </>}
      </div>
    </div>
  );
}
