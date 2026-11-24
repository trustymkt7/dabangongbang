// 기술사 답안공방 오프라인 캐시 — 버전 20261124-2101
const CACHE = 'pe-20261124-2101';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
// 설치할 때 CDN 이 아직 옛 파일을 줄 수 있어(배포 직후) 주소에 버전을 붙여 새로 받고, index 는 버전 글자를 확인한 뒤에만 저장
async function grab(c, u) {
  for (let i = 0; i < 8; i++) {
    const r = await fetch(u + '?v=20261124-2101&t=' + Date.now(), { cache: 'reload' });
    if (r.ok) {
      if (u === './' || u === './index.html') { const t = await r.clone().text(); if (!t.includes('20261124-2101')) { await new Promise(s => setTimeout(s, 8000)); continue; } }
      await c.put(u, r); return;
    }
  }
  throw new Error('옛 파일만 받음: ' + u);
}
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => grab(c, u))))); });
self.addEventListener('message', e => { if (e.data === 'skip') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('pe-') && k !== CACHE && k !== 'pe-fonts' && k !== 'pe-audio').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.hostname.endsWith('fonts.googleapis.com') || u.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.open('pe-fonts').then(async c => {
      const hit = await c.match(e.request); if (hit) return hit;
      try { const r = await fetch(e.request); if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; } catch (er) { return hit || Response.error(); }
    }));
    return;
  }
  if (u.origin !== location.origin) return;
  if (u.pathname.includes('/audio/')) return;          // 해설 음성은 앱이 pe-audio 에 직접 저장(버전이 바뀌어도 유지)
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; }
    catch (er) { return (await c.match('./index.html')) || Response.error(); }
  }));
});
