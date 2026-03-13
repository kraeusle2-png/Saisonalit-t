// api/marketdata.js
// Vercel Serverless Function – läuft serverseitig, kein CORS-Problem
// Ruft Yahoo Finance & FRED API ab und gibt aufbereitete Filterdaten zurück

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=900"); // 15 min cache

  try {
    const now = new Date().toISOString();

    // ── 1. KURSDATEN via Yahoo Finance (kostenlos, kein API-Key nötig) ──────
    const symbols = {
      sp500:  "^GSPC",
      nasdaq: "^IXIC",
      gold:   "GC=F",
      oil:    "CL=F",
      gas:    "NG=F",
      copper: "HG=F",
      sugar:  "SB=F",
      usd:    "DX-Y.NYB",
      gbpjpy: "GBPJPY=X",
      audjpy: "AUDJPY=X",
    };

    const symbolList = Object.values(symbols).join(",");
    const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolList)}&fields=regularMarketPrice,regularMarketChangePercent,fiftyDayAverage,twoHundredDayAverage,regularMarketTime`;

    const yahooRes  = await fetch(yahooUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const yahooJson = await yahooRes.json();
    const quotes    = yahooJson?.quoteResponse?.result ?? [];

    // Index by symbol
    const q = {};
    for (const quote of quotes) {
      const key = Object.entries(symbols).find(([, v]) => v === quote.symbol)?.[0];
      if (key) q[key] = quote;
    }

    function ma200Status(quote) {
      if (!quote) return null;
      const price = quote.regularMarketPrice;
      const ma200 = quote.twoHundredDayAverage;
      if (!price || !ma200) return null;
      return {
        price:   +price.toFixed(2),
        ma200:   +ma200.toFixed(2),
        above:   price > ma200,
        pctDiff: +(((price - ma200) / ma200) * 100).toFixed(2),
      };
    }

    function rsiApprox(quote) {
      // Yahoo liefert kein RSI direkt – wir schätzen via 14d Change
      // Positiver Wert = eher überkauft, negativer = eher überverkauft
      if (!quote) return null;
      const chg = quote.regularMarketChangePercent;
      return chg != null ? +chg.toFixed(2) : null;
    }

    // ── 2. FRED API – Makrodaten (kostenlos, kein Key für basic series) ────
    // ISM PMI Proxy via FRED: MANEMP (Manufacturing Employment) als Näherung
    // Echter ISM braucht ISM-Abo – wir nutzen FRED's S&P500 PE und T10Y2Y (Zinskurve)
    let yieldCurve = null;
    let fedFunds   = null;
    try {
      const fredBase = "https://fred.stlouisfed.org/graph/fredgraph.csv";
      // 10Y-2Y Spread (Zinskurve)
      const fredRes = await fetch(`${fredBase}?id=T10Y2Y`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const csv = await fredRes.text();
      const lines = csv.trim().split("\n");
      const last = lines[lines.length - 1].split(",");
      yieldCurve = parseFloat(last[1]);

      // Fed Funds Rate
      const fredRes2 = await fetch(`${fredBase}?id=FEDFUNDS`, {
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      const csv2 = await fredRes2.text();
      const lines2 = csv2.trim().split("\n");
      const last2 = lines2[lines2.length - 1].split(",");
      fedFunds = parseFloat(last2[1]);
    } catch (_) {}

    // ── 3. FILTER-AUSWERTUNG PRO TRADE ──────────────────────────────────────
    const sp500ma  = ma200Status(q.sp500);
    const nasdaqma = ma200Status(q.nasdaq);
    const goldma   = ma200Status(q.gold);
    const oilma    = ma200Status(q.oil);
    const gasma    = ma200Status(q.gas);
    const copperma = ma200Status(q.copper);
    const sugarma  = ma200Status(q.sugar);
    const usdChg   = q.usd?.regularMarketChangePercent;
    const goldChg  = q.gold?.regularMarketChangePercent;

    // Makro: Zinskurve nicht zu stark invertiert (> -0.5 = ok), Trend positiv
    const macroOk = yieldCurve != null ? yieldCurve > -0.5 : null;

    const tradeFilters = {
      1:  { // S&P 500 / DAX
        trend:       sp500ma ? { met: sp500ma.above, detail: `S&P 200-MA: Kurs ${sp500ma.price} vs MA ${sp500ma.ma200} (${sp500ma.pctDiff > 0 ? "+" : ""}${sp500ma.pctDiff}%)` } : null,
        momentum:    q.sp500 ? { met: (q.sp500.regularMarketChangePercent ?? 0) > -1, detail: `Tageschange: ${(q.sp500.regularMarketChangePercent??0).toFixed(2)}%` } : null,
        macro:       macroOk != null ? { met: macroOk, detail: `Zinskurve 10J-2J: ${yieldCurve?.toFixed(2)}% (${macroOk ? "nicht invertiert ✓" : "invertiert ✗"})` } : null,
        intermarket: usdChg != null ? { met: (usdChg ?? 0) < 0.5, detail: `USD-Index Change: ${(usdChg??0).toFixed(2)}% (schwacher USD = bullisch für Aktien)` } : null,
      },
      2:  { // Erdgas
        trend:       gasma ? { met: gasma.above, detail: `Erdgas 200-MA: Kurs ${gasma.price} vs MA ${gasma.ma200} (${gasma.pctDiff > 0 ? "+" : ""}${gasma.pctDiff}%)` } : null,
        momentum:    q.gas ? { met: (q.gas.regularMarketChangePercent ?? 0) > 0, detail: `Erdgas Tageschange: ${(q.gas.regularMarketChangePercent??0).toFixed(2)}%` } : null,
        intermarket: oilma ? { met: oilma.above, detail: `Rohöl über 200-MA: ${oilma.above ? "ja ✓" : "nein ✗"} (Energiemarkt-Bestätigung)` } : null,
      },
      3:  { // Gold / Silber
        trend:       goldma ? { met: goldma.above, detail: `Gold 200-MA: Kurs ${goldma.price} vs MA ${goldma.ma200} (${goldma.pctDiff > 0 ? "+" : ""}${goldma.pctDiff}%)` } : null,
        momentum:    q.gold ? { met: (q.gold.regularMarketChangePercent ?? 0) > 0, detail: `Gold Tageschange: ${(q.gold.regularMarketChangePercent??0).toFixed(2)}%` } : null,
        intermarket: usdChg != null ? { met: (usdChg ?? 0) < 0, detail: `USD fällt: ${(usdChg??0) < 0 ? "ja ✓" : "nein ✗"} (bullisch für Gold)` } : null,
        macro:       macroOk != null ? { met: !macroOk || yieldCurve < 1, detail: `Zinskurve: ${yieldCurve?.toFixed(2)}% (niedrig = bullisch für Gold)` } : null,
      },
      4:  { // Rohöl
        trend:       oilma ? { met: oilma.above, detail: `Öl 200-MA: Kurs ${oilma.price} vs MA ${oilma.ma200} (${oilma.pctDiff > 0 ? "+" : ""}${oilma.pctDiff}%)` } : null,
        momentum:    q.oil ? { met: (q.oil.regularMarketChangePercent ?? 0) > 0, detail: `Öl Tageschange: ${(q.oil.regularMarketChangePercent??0).toFixed(2)}%` } : null,
        intermarket: gasma ? { met: gasma.above, detail: `Erdgas über 200-MA: ${gasma.above ? "ja ✓" : "nein ✗"} (Energie-Sektor-Bestätigung)` } : null,
      },
      5:  { // S&P 500 Q4 (gleich wie Trade 1)
        trend:       sp500ma ? { met: sp500ma.above, detail: `S&P 200-MA: ${sp500ma.above ? "Kurs darüber ✓" : "Kurs darunter ✗"} (${sp500ma.pctDiff > 0 ? "+" : ""}${sp500ma.pctDiff}%)` } : null,
        macro:       macroOk != null ? { met: macroOk, detail: `Zinskurve 10J-2J: ${yieldCurve?.toFixed(2)}%` } : null,
        intermarket: nasdaqma ? { met: nasdaqma.above, detail: `Nasdaq über 200-MA: ${nasdaqma.above ? "ja ✓" : "nein ✗"}` } : null,
      },
      6:  { // GBP/JPY Short
        trend:       q.gbpjpy ? { met: (q.gbpjpy.regularMarketChangePercent ?? 0) < 0, detail: `GBP/JPY Tageschange: ${(q.gbpjpy.regularMarketChangePercent??0).toFixed(2)}%` } : null,
        intermarket: q.audjpy ? { met: (q.audjpy.regularMarketChangePercent ?? 0) < 0, detail: `AUD/JPY auch fallend: ${(q.audjpy.regularMarketChangePercent??0) < 0 ? "ja ✓" : "nein ✗"} (Risk-off Bestätigung)` } : null,
        macro:       macroOk != null ? { met: !macroOk, detail: `Risk-off Umfeld: ${!macroOk ? "Zinskurve invertiert ✓" : "Zinskurve normal ✗"}` } : null,
      },
      7:  { // AUD/JPY Short
        trend:       q.audjpy ? { met: (q.audjpy.regularMarketChangePercent ?? 0) < 0, detail: `AUD/JPY Tageschange: ${(q.audjpy.regularMarketChangePercent??0).toFixed(2)}%` } : null,
        intermarket: q.gbpjpy ? { met: (q.gbpjpy.regularMarketChangePercent ?? 0) < 0, detail: `GBP/JPY auch fallend: ${(q.gbpjpy.regularMarketChangePercent??0) < 0 ? "ja ✓" : "nein ✗"} (Risk-off Bestätigung)` } : null,
      },
      8:  { // Zucker Short
        trend:       sugarma ? { met: !sugarma.above, detail: `Zucker 200-MA: Kurs ${sugarma.above ? "darüber (bärisch)" : "darunter ✓"} (${sugarma.pctDiff > 0 ? "+" : ""}${sugarma.pctDiff}%)` } : null,
        momentum:    q.sugar ? { met: (q.sugar.regularMarketChangePercent ?? 0) < 0, detail: `Zucker Tageschange: ${(q.sugar.regularMarketChangePercent??0).toFixed(2)}%` } : null,
      },
      9:  { // Kupfer
        trend:       copperma ? { met: copperma.above, detail: `Kupfer 200-MA: Kurs ${copperma.price} vs MA ${copperma.ma200} (${copperma.pctDiff > 0 ? "+" : ""}${copperma.pctDiff}%)` } : null,
        momentum:    q.copper ? { met: (q.copper.regularMarketChangePercent ?? 0) > 0, detail: `Kupfer Tageschange: ${(q.copper.regularMarketChangePercent??0).toFixed(2)}%` } : null,
        intermarket: sp500ma ? { met: sp500ma.above, detail: `S&P über 200-MA: ${sp500ma.above ? "ja ✓" : "nein ✗"} (globale Nachfrage)` } : null,
      },
      10: { // Nasdaq / Tech
        trend:       nasdaqma ? { met: nasdaqma.above, detail: `Nasdaq 200-MA: Kurs ${nasdaqma.price} vs MA ${nasdaqma.ma200} (${nasdaqma.pctDiff > 0 ? "+" : ""}${nasdaqma.pctDiff}%)` } : null,
        momentum:    q.nasdaq ? { met: (q.nasdaq.regularMarketChangePercent ?? 0) > -0.5, detail: `Nasdaq Tageschange: ${(q.nasdaq.regularMarketChangePercent??0).toFixed(2)}%` } : null,
        intermarket: sp500ma ? { met: sp500ma.above, detail: `S&P über 200-MA: ${sp500ma.above ? "ja ✓" : "nein ✗"} (breiter Markt bestätigt)` } : null,
        macro:       macroOk != null ? { met: macroOk, detail: `Makroumfeld: ${macroOk ? "positiv ✓" : "negativ ✗"}` } : null,
      },
    };

    // ── 4. PREISÜBERSICHT ────────────────────────────────────────────────────
    const prices = {};
    for (const [key, quote] of Object.entries(q)) {
      if (quote) {
        prices[key] = {
          price:  quote.regularMarketPrice ? +quote.regularMarketPrice.toFixed(2) : null,
          change: quote.regularMarketChangePercent ? +quote.regularMarketChangePercent.toFixed(2) : null,
          time:   quote.regularMarketTime ? new Date(quote.regularMarketTime * 1000).toISOString() : null,
        };
      }
    }

    res.status(200).json({
      fetchedAt:    now,
      prices,
      yieldCurve:   yieldCurve != null ? +yieldCurve.toFixed(3) : null,
      fedFunds:     fedFunds   != null ? +fedFunds.toFixed(2)   : null,
      tradeFilters,
    });

  } catch (err) {
    res.status(500).json({ error: err.message, fetchedAt: new Date().toISOString() });
  }
}
