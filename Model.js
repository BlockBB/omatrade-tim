// Shaping the CLI's output for the panel.
//
// Kept out of the QML so it can be reasoned about on its own: the panel is
// three lists of rows, and working out what a row says is not a layout problem.

.pragma library

function parse(text) {
  if (!text || !text.trim()) return { data: null, error: "" }
  try {
    var parsed = JSON.parse(text)
    return { data: parsed, error: parsed.error || "" }
  } catch (e) {
    return { data: null, error: "unreadable output" }
  }
}

// The TradingView watchlist: section headers and symbols in one stream, so
// the list does not have to nest. One unnamed section gets no header at all.
function watchlistRows(watchlist) {
  var out = []
  var sections = watchlist && Array.isArray(watchlist.sections) ? watchlist.sections : []
  for (var s = 0; s < sections.length; s++) {
    var section = sections[s]
    var entries = Array.isArray(section.entries) ? section.entries : []
    if (!entries.length) continue
    if (section.name) out.push({ header: true, name: section.name })
    for (var e = 0; e < entries.length; e++) {
      var entry = entries[e]
      out.push({
        header: false,
        symbol: entry.symbol,
        display: entry.display,
        exchange: entry.exchange,
        name: entry.found ? entry.name : "Not found on TradingView",
        last: entry.last,
        changePct: entry.changePct,
        hasQuote: entry.last !== null && entry.last !== undefined
      })
    }
  }
  return out
}

// Search results as rows the same list can draw.
function searchRows(results) {
  var out = []
  if (!Array.isArray(results)) return out
  for (var i = 0; i < results.length; i++) {
    var r = results[i]
    out.push({ header: false, symbol: r.symbol, display: r.display, exchange: r.exchange,
               name: r.name, type: r.type })
  }
  return out
}

function newsRows(news) {
  return news && Array.isArray(news.items) ? news.items : []
}

// Accounts and their positions in one stream, headers and entries together.
function positionRows(accounts) {
  var out = []
  if (!Array.isArray(accounts)) return out
  for (var a = 0; a < accounts.length; a++) {
    var account = accounts[a]
    var positions = Array.isArray(account.positions) ? account.positions : []
    out.push({
      header: true,
      name: account.name,
      label: account.label || "",
      equity: account.equity,
      dayPnlPct: account.dayPnlPct
    })
    for (var p = 0; p < positions.length; p++) {
      var pos = positions[p]
      var prediction = pos.kind === "prediction"
      out.push({
        header: false,
        symbol: pos.symbol,
        // A market's question is what you recognise it by; the outcome you
        // hold is the detail, so the two trade places on prediction rows.
        title: prediction ? pos.name : pos.display,
        subtitle: pos.sizeLabel,
        kind: pos.kind,
        last: pos.last,
        value: pos.value,
        pnl: pos.pnl,
        pnlPct: pos.pnlPct,
        spark: Array.isArray(pos.spark) ? pos.spark : []
      })
    }
  }
  return out
}

function selectableIndexes(rows) {
  var out = []
  for (var i = 0; i < rows.length; i++) if (!rows[i].header) out.push(i)
  return out
}

function decimals(price) {
  var size = Math.abs(price)
  if (size >= 1) return 2
  if (size >= 0.01) return 4
  return 6
}

function groupThousands(fixed) {
  var parts = fixed.split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return parts.join(".")
}

function formatPrice(value) {
  if (value === null || value === undefined) return "–"
  var fixed = Number(value).toFixed(decimals(value))
  return Math.abs(value) >= 1000 ? groupThousands(fixed) : fixed
}

function formatMoney(value, signed) {
  if (value === null || value === undefined) return "–"
  var sign = value < 0 ? "-" : (signed && value > 0 ? "+" : "")
  return sign + "$" + groupThousands(Math.abs(value).toFixed(2))
}

// For the narrow places — an account header, the tooltip — where cents are
// noise and five digits of dollars already say enough.
function formatCompactMoney(value, signed) {
  if (value === null || value === undefined) return "–"
  var size = Math.abs(value)
  var sign = value < 0 ? "-" : (signed && value > 0 ? "+" : "")
  if (size >= 1e6) return sign + "$" + (size / 1e6).toFixed(2) + "M"
  if (size >= 1e4) return sign + "$" + (size / 1e3).toFixed(1) + "k"
  return sign + "$" + groupThousands(size.toFixed(0))
}

function formatPercent(value) {
  if (value === null || value === undefined) return ""
  var sign = value > 0 ? "+" : ""
  return sign + Number(value).toFixed(2) + "%"
}

function ago(ts, now) {
  var s = Math.max(0, Math.floor(now / 1000 - ts))
  if (s < 60) return "now"
  if (s < 3600) return Math.floor(s / 60) + "m"
  if (s < 86400) return Math.floor(s / 3600) + "h"
  return Math.floor(s / 86400) + "d"
}

// The colours the panel draws in, by role. Every one comes from the CLI,
// which derives them from the desktop theme and checks each against the
// panel's ground; until the first answer the panel's own text and ground
// stand in, so not one colour in the widget is its own.
function palette(colors, text, ground) {
  var given = colors || {}
  var pick = function (key, fallback) { return given[key] ? given[key] : fallback }
  var written = pick("text", text)
  var givenTags = given.tags || {}
  var tag = function (way, fill) {
    var t = givenTags[way] || {}
    return { fill: t.fill ? t.fill : fill, label: t.label ? t.label : ground }
  }
  var out = {
    text: written,
    muted: pick("muted", written),
    up: pick("up", written),
    down: pick("down", written),
    flat: pick("flat", pick("muted", written)),
    accent: pick("accent", written),
    hover: pick("hover", ground),
    rule: pick("rule", pick("muted", written))
  }
  out.tags = {
    up: tag("up", out.up),
    down: tag("down", out.down),
    flat: tag("flat", out.flat),
    accent: tag("accent", out.accent)
  }
  return out
}

function direction(value) {
  if (value === null || value === undefined) return "flat"
  if (value > 0) return "up"
  if (value < 0) return "down"
  return "flat"
}
