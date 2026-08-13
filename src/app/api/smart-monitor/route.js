import { NextResponse } from 'next/server';

const SMART_MONITOR_URL = process.env.SMART_MONITOR_URL || 'http://brsaobrj9273ww6:2030';
const SMART_MONITOR_USER = process.env.SMART_MONITOR_USER || 'SPS_SUPORTE';
const SMART_MONITOR_PASS = process.env.SMART_MONITOR_PASS || 'Brasil01@';

// Cache for session cookies
let sessionCookies = '';

async function loginToSmartMonitor() {
  try {
    console.log(`[Smart Monitor] Autenticando em ${SMART_MONITOR_URL}...`);

    const getRes = await fetch(`${SMART_MONITOR_URL}/login/`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000),
    });

    const html = await getRes.text();

    const csrfMatch = html.match(/name=["']csrfmiddlewaretoken["']\s+value=["']([^"']+)["']/) ||
                      html.match(/value=["']([^"']+)["']\s+name=["']csrfmiddlewaretoken["']/);
    if (!csrfMatch) {
      console.error('[Smart Monitor] Falha ao extrair CSRF token.');
      return false;
    }
    const csrfToken = csrfMatch[1];

    const setCookieHeaders = getRes.headers.getSetCookie?.() || [];
    const tempCookies = setCookieHeaders.map(c => c.split(';')[0]).join('; ');

    const params = new URLSearchParams();
    params.append('csrfmiddlewaretoken', csrfToken);
    params.append('username', SMART_MONITOR_USER);
    params.append('password', SMART_MONITOR_PASS);
    params.append('next', '/');

    const postRes = await fetch(`${SMART_MONITOR_URL}/login/`, {
      method: 'POST',
      headers: {
        'Cookie': tempCookies,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': `${SMART_MONITOR_URL}/login/`,
        'User-Agent': 'Mozilla/5.0',
      },
      body: params.toString(),
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    });

    const postCookies = postRes.headers.getSetCookie?.() || [];
    if (postCookies.length > 0) {
      sessionCookies = [...setCookieHeaders, ...postCookies].map(c => c.split(';')[0]).join('; ');
      console.log('[Smart Monitor] Autenticado com sucesso!');
      return true;
    } else {
      console.error('[Smart Monitor] Falha na autenticação.');
      return false;
    }
  } catch (err) {
    console.error(`[Smart Monitor] Erro no login: ${err.message}`);
    return false;
  }
}

/**
 * Parse device cards from Smart Monitor HTML.
 *
 * Card structure:
 * <a href="/device/HOSTNAME/" class="device-card ... border-red-500 ..." data-search-text="name ip serial mac" data-channel="CH31">
 *   <h3>Name <span>(SERIAL)</span></h3>
 *   ... RAM xx.x% ... Disco xx.x% ... Último sync: dd/mm/yyyy hh:mm:ss
 * </a>
 */
function parseDeviceCards(html) {
  const devices = [];

  // Match <a> tags with class containing "device-card"
  const cardPattern = /<a\s[^>]*class="[^"]*device-card[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = cardPattern.exec(html)) !== null) {
    const fullMatch = match[0];
    const body = match[1];

    // data-search-text: "name parts... ip serial mac"
    const searchTextMatch = fullMatch.match(/data-search-text="([^"]+)"/i);
    if (!searchTextMatch) continue;
    const searchText = searchTextMatch[1];

    // Channel
    const channelMatch = fullMatch.match(/data-channel="([^"]+)"/i);
    const canal = channelMatch ? channelMatch[1] : 'Desconhecido';

    // Status from border class
    const isOffline = /border-red-500|border-red-600|border-red-400/i.test(fullMatch);
    const isOnline = /border-emerald|border-green|border-blue|border-cyan|border-teal|border-lime|border-indigo/i.test(fullMatch);
    const hasAnyColorBorder = /border-(red|emerald|green|blue|cyan|teal|lime|indigo|violet|purple|pink|orange|amber|yellow|success|danger|primary|info|warning)-/i.test(fullMatch);
    const hasBorderClass = /border-\w+/i.test(fullMatch);
    const status = isOffline ? 'offline' : (isOnline ? 'online' : (hasAnyColorBorder ? 'online' : (hasBorderClass ? 'online' : 'unknown')));

    // Parse search text tokens
    const tokens = searchText.trim().split(/\s+/);

    // IP pattern
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ip = tokens.find(t => ipPattern.test(t)) || 'Desconhecido';

    // MAC pattern
    const macPattern = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i;
    const mac = tokens.find(t => macPattern.test(t)) || 'N/A';

    // Serial from search text (alphanumeric, 6+ chars, not IP/MAC)
    const serialFromSearch = tokens.find(t => /^[A-Z0-9]{6,}$/i.test(t) && !ipPattern.test(t) && !macPattern.test(t)) || '';

    // PC name and serial from <h3>
    const h3Match = body.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
    let pcName = 'Desconhecido';
    let serial = serialFromSearch;
    let hostname = '';

    if (h3Match) {
      const h3Inner = h3Match[1];
      const serialMatch = h3Inner.match(/<span[^>]*>\(([^)]+)\)<\/span>/i);
      if (serialMatch) serial = serialMatch[1].trim();
      pcName = h3Inner.replace(/<span[^>]*>[\s\S]*?<\/span>/gi, '').replace(/<[^>]+>/g, '').trim();
    }

    if (!pcName || pcName === 'Desconhecido') {
      pcName = tokens[0] || 'Desconhecido';
    }

    // Hostname from href="/device/HOSTNAME/"
    const hrefInCard = fullMatch.match(/href="[^"]*\/device\/([^/"]+)/i);
    hostname = hrefInCard ? hrefInCard[1] : serial;

    // RAM usage
    const ramMatch = body.match(/RAM[\s\S]*?(\d+\.?\d*)\s*%/i);
    const ram = ramMatch ? parseFloat(ramMatch[1]) : null;

    // Disk usage
    const discoMatch = body.match(/Disco[\s\S]*?(\d+\.?\d*)\s*%/i);
    const disco = discoMatch ? parseFloat(discoMatch[1]) : null;

    // Last sync
    const syncMatch = body.match(/Último sync[\s\S]*?(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}(?::\d{2})?)/i);
    const ultimoSync = syncMatch ? syncMatch[1] : null;

    // Link
    const hrefMatch = fullMatch.match(/href="([^"]+)"/i);
    const href = hrefMatch ? hrefMatch[1] : null;

    // Fallback: if status is unknown but device has system data, treat as online
    const finalStatus = (status === 'unknown' && (ram !== null || disco !== null)) ? 'online' : status;

    devices.push({
      pcName: pcName || `PC ${ip}`,
      hostname: hostname || serial,
      serial,
      mac,
      ip,
      canal,
      status: finalStatus,
      ram,
      disco,
      ultimoSync,
      href,
    });
  }

  return devices;
}

async function scrapeSmartMonitor() {
  if (!sessionCookies) {
    const logged = await loginToSmartMonitor();
    if (!logged) return { devices: [], allDevices: [], error: 'Falha na autenticação' };
  }

  try {
    // Fetch the devices grid endpoint (returns HTML with all device cards)
    const response = await fetch(`${SMART_MONITOR_URL}/devices/grid/`, {
      headers: {
        'Cookie': sessionCookies,
        'User-Agent': 'Mozilla/5.0',
        'X-Requested-With': 'XMLHttpRequest',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (response.status === 302 || response.status === 403 || response.status === 401) {
      sessionCookies = '';
      return { devices: [], allDevices: [], error: 'Sessão expirada, tente novamente' };
    }

    const html = await response.text();
    console.log(`[Smart Monitor] Grid HTML recebido: ${html.length} caracteres`);

    const allDevices = parseDeviceCards(html);
    console.log(`[Smart Monitor] Dispositivos extraídos: ${allDevices.length}`);

    const offlineDevices = allDevices.filter(d => d.status === 'offline');

    return {
      devices: offlineDevices,
      allDevices,
      total: allDevices.length,
      offline: offlineDevices.length,
      online: allDevices.filter(d => d.status === 'online').length,
      unknown: allDevices.filter(d => d.status === 'unknown').length,
      error: null,
    };
  } catch (err) {
    console.error(`[Smart Monitor] Erro no scrape: ${err.message}`);
    return { devices: [], allDevices: [], error: err.message };
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const showAll = searchParams.get('all') === 'true';

    const result = await scrapeSmartMonitor();

    return NextResponse.json({
      ...result,
      devices: showAll ? result.allDevices : result.devices,
    });
  } catch (error) {
    return NextResponse.json(
      { devices: [], allDevices: [], error: error.message },
      { status: 500 }
    );
  }
}
