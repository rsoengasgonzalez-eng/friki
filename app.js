(() => {
  'use strict';
  const D = window.FRIKI_DATA;
  const $ = (s, p=document) => p.querySelector(s);
  const $$ = (s, p=document) => [...p.querySelectorAll(s)];
  const storeItems = D.stores.map(x=>({...x,kind:'store'}));
  const placeItems = D.places.map(x=>({...x,kind:'place'}));
  const allPlaces = [...storeItems,...placeItems];
  const allItems = [...allPlaces, ...D.events.map(x=>({...x,kind:'event'}))];
  const byId = Object.fromEntries(allItems.map(x=>[x.id,x]));
  const accents = ['#ffd33d','#ff8a3d','#37d5d3','#ff4e91','#63e69b','#a999ff'];
  let deferredPrompt = null;
  let activeView = 'inicio';
  let stickerMode = 'gif';
  let mediaQuery = '';
  let mediaGroup = 'all';
  let mediaLimit = 40;
  let eventFilter = 'all';
  let rankingType = 'movies';
  let rankingQuery = '';
  let rankingLimit = 25;
  const state = {kind:'all',tags:new Set(),zone:'all',budget:'all',query:'',favOnly:false,display:'grid'};
  const saved = (k,fallback) => { try{return JSON.parse(localStorage.getItem(k)) ?? fallback}catch{return fallback} };
  let favorites = new Set(saved('fm-favorites',[]));
  let customRoute = saved('fm-route',[]).filter(id=>byId[id]);

  function norm(v=''){return v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
  function escapeHtml(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
  function mapUrl(item){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address || item.name+', Madrid')}`}
  function colorFor(item){return accents[Math.abs([...item.id].reduce((a,c)=>a+c.charCodeAt(0),0))%accents.length]}
  function persist(){localStorage.setItem('fm-favorites',JSON.stringify([...favorites]));localStorage.setItem('fm-route',JSON.stringify(customRoute));}
  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2400)}

  function navigate(view, push=true){
    activeView=view;
    $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.viewPanel===view));
    $$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    if(push) history.replaceState(null,'',`#${view}`);
    window.scrollTo({top:0,behavior:'smooth'});
    if(view==='explorar') renderExplore();
    if(view==='eventos') renderEvents();
    if(view==='rutas') renderRoutes();
    if(view==='rankings') renderRankings();
    if(view==='stickers') renderStickers();
    if(view==='favoritos') renderFavorites();
  }

  function card(item){
    const tags=item.tags.slice(0,3).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('');
    return `<article class="place-card" data-id="${item.id}">
      <div class="card-visual" style="--accent:${colorFor(item)}"><span>${item.emoji}</span><button class="fav-btn ${favorites.has(item.id)?'active':''}" data-fav="${item.id}" aria-label="${favorites.has(item.id)?'Quitar de':'Añadir a'} favoritos">♥</button></div>
      <div class="card-body"><div class="card-meta"><span>${item.kind==='store'?'Tienda':'Sitio'} · ${escapeHtml(item.zone)}</span><span>${escapeHtml(item.budget)}</span></div>
      <h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.description)}</p><div class="tag-row">${tags}</div>
      <div class="card-actions"><button data-detail="${item.id}">Ver ficha</button><a class="map-btn" href="${mapUrl(item)}" target="_blank" rel="noopener">Cómo llegar ↗</a></div></div></article>`;
  }

  function toggleFavorite(id){
    favorites.has(id)?favorites.delete(id):favorites.add(id);persist();updateFavCount();
    $$(`[data-fav="${id}"]`).forEach(b=>{b.classList.toggle('active',favorites.has(id));b.setAttribute('aria-label',favorites.has(id)?'Quitar de favoritos':'Añadir a favoritos')});
    toast(favorites.has(id)?'Guardado en tu inventario ♥':'Eliminado de favoritos');
    if(activeView==='favoritos')renderFavorites();
  }
  function updateFavCount(){$('#favoriteCount').textContent=favorites.size}

  function renderHome(){
    $('#storeStat').textContent=D.stores.length;$('#placeStat').textContent=D.places.length;$('#eventStat').textContent=D.events.length;$('#stickerStat').textContent=(window.FRIKI_MEDIA.length*2).toLocaleString('es-ES');
    const universes=[
      {icon:'💥',name:'Cómic',text:'Librerías, novela gráfica y coleccionismo',tag:'comic',bg:'#fff0b8'},
      {icon:'🌸',name:'Manga & anime',text:'Manga, figuras, cosplay y cultura japonesa',tag:'manga',bg:'#ffe0ec'},
      {icon:'🎲',name:'Rol & tablero',text:'Juegos, miniaturas, TCG y cafés lúdicos',tag:'juegos de mesa',bg:'#dff8f6'},
      {icon:'🎮',name:'Gaming',text:'Arcades, VR, retro y esports',tag:'videojuegos',bg:'#e5ddff'}
    ];
    $('#universeGrid').innerHTML=universes.map(u=>`<button class="universe-card" style="--u-bg:${u.bg}" data-universe="${u.tag}"><span class="u-icon">${u.icon}</span><h3>${u.name}</h3><p>${u.text}</p><b>↗</b></button>`).join('');
    $('#featuredGrid').innerHTML=allPlaces.filter(x=>x.featured).slice(0,6).map(card).join('');
    const next=D.events.filter(e=>e.start&&e.status==='confirmado').sort((a,b)=>a.start.localeCompare(b.start))[0];
    if(next){$('#nextEventTitle').textContent=next.name;$('#nextEventText').textContent=`${next.dateLabel} · ${next.venue}. ${next.description}`;renderCountdown(next.start)}
  }
  function renderCountdown(date){
    const target=new Date(date+'T10:00:00+01:00').getTime();
    const now=Date.now();let diff=Math.max(0,target-now);
    const days=Math.floor(diff/86400000);diff%=86400000;const hours=Math.floor(diff/3600000);diff%=3600000;const mins=Math.floor(diff/60000);
    $('#homeCountdown').innerHTML=[[days,'días'],[hours,'horas'],[mins,'min']].map(([v,l])=>`<span><b>${String(v).padStart(2,'0')}</b><small>${l}</small></span>`).join('');
  }

  function setupFilters(){
    const tags=['cómic','manga','juegos de mesa','rol','videojuegos','arcade','tecnología','familias'];
    $('#tagFilters').innerHTML=tags.map(t=>`<label><input type="checkbox" value="${t}"> ${t[0].toUpperCase()+t.slice(1)}</label>`).join('');
    const zones=[...new Set(allPlaces.map(x=>x.zone))].sort((a,b)=>a.localeCompare(b,'es'));
    $('#zoneFilter').insertAdjacentHTML('beforeend',zones.map(z=>`<option>${escapeHtml(z)}</option>`).join(''));
  }
  function resetFilters(){state.kind='all';state.tags.clear();state.zone='all';state.budget='all';state.query='';state.favOnly=false;$('#searchInput').value='';$('#zoneFilter').value='all';$('#budgetFilter').value='all';$('#favOnly').checked=false;$$('#tagFilters input').forEach(i=>i.checked=false);$$('[data-kind]').forEach(b=>b.classList.toggle('active',b.dataset.kind==='all'));renderExplore()}
  function renderExplore(){
    const q=norm(state.query);
    const items=allPlaces.filter(item=>{
      const hay=norm([item.name,item.category,item.zone,item.address,item.description,...item.tags].join(' '));
      const tagOk=!state.tags.size||[...state.tags].every(t=>hay.includes(norm(t)));
      return (state.kind==='all'||item.kind===state.kind)&&(!q||hay.includes(q))&&tagOk&&(state.zone==='all'||item.zone===state.zone)&&(state.budget==='all'||item.budget===state.budget)&&(!state.favOnly||favorites.has(item.id));
    });
    $('#resultCount').textContent=`${items.length} ${items.length===1?'lugar':'lugares'}`;
    $('#exploreGrid').innerHTML=items.map(card).join('');$('#exploreGrid').classList.toggle('list',state.display==='list');$('#emptyState').hidden=items.length>0;
  }

  function statusText(s){return {confirmado:'Confirmado',anunciado:'Anunciado',revisar:'Verificar fecha',radar:'En el radar',agenda:'Agenda continua'}[s]||s}
  function dateBadge(e){if(!e.start)return ['??','Pendiente'];const d=new Date(e.start+'T12:00:00');return [String(d.getDate()).padStart(2,'0'),d.toLocaleDateString('es-ES',{month:'short'}).replace('.','')]}
  function eventCard(e){const [day,mon]=dateBadge(e);return `<article class="event-card" data-id="${e.id}"><div class="event-date"><b>${day}</b><span>${mon}</span></div><div><span class="status ${e.status}">${statusText(e.status)}</span><h3>${e.emoji} ${escapeHtml(e.name)}</h3><p><b>${escapeHtml(e.dateLabel)}</b> · ${escapeHtml(e.venue)}</p><p>${escapeHtml(e.description)}</p></div><div class="event-buttons"><button data-fav="${e.id}">${favorites.has(e.id)?'♥ Guardado':'♡ Guardar'}</button>${e.start?`<button data-calendar="${e.id}">＋ Calendario</button>`:''}<a class="official" href="${e.url}" target="_blank" rel="noopener">Web oficial ↗</a></div></article>`}
  function renderEvents(){
    const events=D.events.filter(e=>eventFilter==='all'||e.status===eventFilter||(eventFilter==='anunciado'&&e.status==='revisar'));
    $('#eventList').innerHTML=events.map(eventCard).join('');
  }
  function icsDate(date,end=false){const d=new Date(date+`T${end?'23:59':'09:00'}:00+01:00`);return d.toISOString().replace(/[-:]/g,'').replace(/\.000/,'')}
  function downloadBlob(content,name,type='text/plain'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
  function eventIcs(events){
    const blocks=events.filter(e=>e.start).map(e=>`BEGIN:VEVENT\r\nUID:${e.id}@frikimadrid.app\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}\r\nDTSTART:${icsDate(e.start)}\r\nDTEND:${icsDate(e.end||e.start,true)}\r\nSUMMARY:${e.name}\r\nLOCATION:${e.address}\r\nDESCRIPTION:${e.description.replace(/,/g,'\\,')}\\n${e.url}\r\nURL:${e.url}\r\nEND:VEVENT`).join('\r\n');
    return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//FrikiMadrid//ES\r\nCALSCALE:GREGORIAN\r\n${blocks}\r\nEND:VCALENDAR`;
  }

  function routeUrl(ids){
    const items=ids.map(id=>byId[id]).filter(Boolean);if(!items.length)return '#';
    if(items.length===1)return mapUrl(items[0]);
    const origin=items[0].address,destination=items.at(-1).address,waypoints=items.slice(1,-1).map(x=>x.address).join('|');
    return `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints?`&waypoints=${encodeURIComponent(waypoints)}`:''}`;
  }
  function renderRoutes(){
    $('#routeGrid').innerHTML=D.routes.map(r=>`<article class="route-card" style="--route:${r.color}"><div class="route-head"><div><small>${r.time} · ${r.level}</small><h3>${escapeHtml(r.name)}</h3></div><span>${r.emoji}</span></div><p>${escapeHtml(r.description)}</p><div class="route-stops">${r.stops.map(id=>byId[id]).filter(Boolean).map(x=>`<div class="route-stop"><i>${x.emoji}</i><b>${escapeHtml(x.name.split(' ')[0])}</b></div>`).join('')}</div><div class="route-actions"><small>${r.stops.length} paradas</small><a class="btn primary small" href="${routeUrl(r.stops)}" target="_blank" rel="noopener">Abrir ruta ↗</a></div></article>`).join('');
    renderCustomRoute();
  }
  function renderCustomRoute(){
    const box=$('#customRoute');if(!customRoute.length){box.innerHTML='<div class="route-empty">🗺️<br>Añade paradas desde una ficha.</div>';return}
    box.innerHTML=customRoute.map((id,i)=>{const x=byId[id];return `<div class="custom-stop"><span><b>${i+1}.</b> ${x.emoji} ${escapeHtml(x.name)}</span><button data-route-remove="${id}" aria-label="Quitar">×</button></div>`}).join('')+`<div class="custom-actions"><a class="btn yellow small" href="${routeUrl(customRoute)}" target="_blank" rel="noopener">Abrir en Maps ↗</a><button class="btn ghost small" id="clearRoute">Vaciar</button></div>`;
  }
  function addToRoute(id){if(customRoute.includes(id)){toast('Ya está en tu ruta');return}customRoute.push(id);persist();toast('Parada añadida a tu ruta ↝');}

  const wikiCache=saved('fm-wiki-cache',{});
  function rankItem(key){const [type,pos]=key.split(':');return {type,item:window.FRIKI_RANKINGS[type]?.find(x=>x.rank===Number(pos))}}
  function rankMedia(type,rank){const offsets={movies:0,games:170,anime:340};return window.FRIKI_MEDIA[(offsets[type]+rank-1)%window.FRIKI_MEDIA.length]}
  async function getWikiFicha(item){
    const key=`${item.kind}:${item.title}`;if(wikiCache[key])return wikiCache[key];
    const context={Película:'película',Videojuego:'videojuego',Anime:'anime'}[item.kind]||'';
    const request=async lang=>{
      const params=new URLSearchParams({action:'query',format:'json',origin:'*',generator:'search',gsrsearch:`${item.title} ${context}`,gsrlimit:'1',prop:'pageimages|extracts|info',inprop:'url',exintro:'1',explaintext:'1',exsentences:'4',piprop:'thumbnail|name',pithumbsize:'900'});
      const r=await fetch(`https://${lang}.wikipedia.org/w/api.php?${params}`);if(!r.ok)throw new Error('Wikipedia');
      const data=await r.json(),page=Object.values(data.query?.pages||{})[0];
      return page?{title:page.title,extract:page.extract||'',article:page.fullurl||'',image:page.thumbnail?.source||'',file:page.pageimage?`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(page.pageimage.replace(/ /g,'_'))}`:'',lang}:null;
    };
    let result=null;try{result=await request('es');if(!result?.image){const en=await request('en');if(en?.image)result={...(result||en),image:en.image,file:en.file}}}catch{}
    if(result){wikiCache[key]=result;try{localStorage.setItem('fm-wiki-cache',JSON.stringify(wikiCache))}catch{}}
    return result;
  }
  function openRankingDetail(key){
    const {type,item}=rankItem(key);if(!item)return;const media=rankMedia(type,item.rank),wikiSearch=`https://es.wikipedia.org/w/index.php?search=${encodeURIComponent(item.title+' '+item.kind)}`,commons=`https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(item.title)}&title=Special:MediaSearch&type=image`,giphy=`https://giphy.com/search/${encodeURIComponent(item.title)}`,tenor=`https://tenor.com/search/${encodeURIComponent(item.title)}-gifs`;
    $('#modalBody').innerHTML=`<div class="rank-detail-visual"><div id="wikiImageBox" class="wiki-image-box"><img src="${media.image}" alt="Ilustración friki original de reserva"><span>Buscando imagen en Wikimedia…</span></div><div class="rank-gif-box"><img src="${media.gif}" alt="GIF original: ${escapeHtml(media.reaction)}"><b>${escapeHtml(media.reaction)}</b><small>${escapeHtml(media.theme)}</small></div></div><div class="modal-content rank-detail-content"><div class="rank-detail-top"><span class="rank-pill">#${String(item.rank).padStart(3,'0')} · ${escapeHtml(item.kind)}</span><span>${escapeHtml(item.category)}</span></div><h2>${escapeHtml(item.title)}</h2><p class="rank-hook">${escapeHtml(item.hook)}</p><div class="ficha-grid"><div><small>POR QUÉ ESTÁ AQUÍ</small><p>${escapeHtml(item.why)}</p></div><div><small>IDEAL PARA</small><p>${escapeHtml(item.ideal)}</p></div></div><blockquote>“${escapeHtml(item.quip)}”</blockquote><div id="wikiExtract" class="wiki-extract"><b>Ficha enciclopédica</b><p>Cargando resumen e imagen web…</p></div><div class="rank-web-links"><a href="${wikiSearch}" target="_blank" rel="noopener">Wikipedia ↗</a><a href="${commons}" target="_blank" rel="noopener">Imágenes libres ↗</a><a href="${giphy}" target="_blank" rel="noopener">GIFs en GIPHY ↗</a><a href="${tenor}" target="_blank" rel="noopener">GIFs en Tenor ↗</a><button data-copy-title="${escapeHtml(item.title)}">Copiar título</button></div><p class="rights-note">La imagen web se solicita a Wikipedia/Wikimedia al abrir la ficha y conserva enlace a su fuente. Los GIFs de personajes se consultan en GIPHY o Tenor, sujetos a sus condiciones. El GIF mostrado dentro de la ficha es arte original de FrikiMadrid.</p></div>`;
    $('#detailModal').showModal();
    getWikiFicha(item).then(w=>{if(!$('#detailModal').open)return;const extract=$('#wikiExtract'),box=$('#wikiImageBox');if(w){extract.innerHTML=`<b>Ficha enciclopédica · ${w.lang.toUpperCase()}</b><p>${escapeHtml(w.extract||'Consulta el artículo para ampliar información.')}</p>${w.article?`<a href="${w.article}" target="_blank" rel="noopener">Leer artículo completo ↗</a>`:''}`;if(w.image){box.innerHTML=`<img src="${w.image}" referrerpolicy="no-referrer" alt="Imagen web relacionada con ${escapeHtml(item.title)}"><span>${w.file?`<a href="${w.file}" target="_blank" rel="noopener">Fuente y licencia en Wikimedia ↗</a>`:'Imagen vía Wikipedia/Wikimedia'}</span>`}}else{extract.innerHTML='<b>Ficha enciclopédica</b><p>No se pudo recuperar el resumen web. Usa los enlaces para abrir la búsqueda manual.</p>';box.querySelector('span').textContent='Reserva gráfica original de FrikiMadrid'}});
  }
  function filteredRankings(){
    const q=norm(rankingQuery);
    return window.FRIKI_RANKINGS[rankingType].filter(x=>!q||norm([x.title,x.category,x.why].join(' ')).includes(q));
  }
  function renderRankings(){
    const meta={movies:['🎬','Las 100 películas frikis esenciales'],games:['🎮','Los 100 videojuegos imprescindibles'],anime:['🌸','Los 100 animes esenciales']}[rankingType];
    const found=filteredRankings(),items=found.slice(0,rankingLimit);
    $('#rankingIcon').textContent=meta[0];$('#rankingTitle').textContent=meta[1];$('#rankingCount').textContent=`${found.length} ${found.length===1?'título':'títulos'}`;
    $('#rankingGrid').innerHTML=items.map(x=>`<article class="ranking-card" data-rank-detail="${rankingType}:${x.rank}"><div class="rank-number"><small>#</small>${String(x.rank).padStart(3,'0')}</div><div><span>${escapeHtml(x.category)}</span><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.hook)}</p></div><button class="rank-open" data-rank-detail="${rankingType}:${x.rank}" aria-label="Abrir ficha">→</button></article>`).join('');
    $('#rankingLoadMore').hidden=items.length>=found.length;
  }

  function filteredMedia(){
    const q=norm(mediaQuery);
    return window.FRIKI_MEDIA.filter(m=>(mediaGroup==='all'||m.group===mediaGroup)&&(!q||norm([m.theme,m.reaction,m.subtitle,m.group].join(' ')).includes(q)));
  }
  function renderStickers(){
    const found=filteredMedia(),items=found.slice(0,mediaLimit),ext=stickerMode==='gif'?'gif':'png';
    $('#mediaResultCount').textContent=`${found.length} ${found.length===1?'diseño':'diseños'} · ${found.length*2} archivos`;
    $('#stickerGrid').innerHTML=items.map(s=>{const path=stickerMode==='gif'?s.gif:s.image;return `<article class="sticker-card media-card"><div class="sticker-preview"><span class="format-badge">${ext.toUpperCase()} · ${s.group}</span><img loading="lazy" decoding="async" src="${path}" alt="${escapeHtml(s.reaction+' · '+s.theme)}"></div><h3>${escapeHtml(s.reaction)}</h3><p>${escapeHtml(s.theme)} · ${escapeHtml(s.subtitle)}</p><div class="sticker-actions"><a href="${path}" download="frikimadrid-${s.id}.${ext}">↓ Descargar</a><button class="share-sticker" data-share-sticker="${s.id}">Compartir</button></div></article>`}).join('');
    $('#mediaLoadMore').hidden=items.length>=found.length;
  }
  async function shareSticker(id){
    const s=window.FRIKI_MEDIA.find(x=>x.id===id),ext=stickerMode==='gif'?'gif':'png',path=stickerMode==='gif'?s.gif:s.image;
    try{const blob=await fetch(path).then(r=>r.blob());const file=new File([blob],`frikimadrid-${id}.${ext}`,{type:blob.type||`image/${ext}`});if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:s.reaction,text:`${s.theme} · diseño original de FrikiMadrid`});return}throw new Error('fallback')}catch{const a=document.createElement('a');a.href=path;a.download=`frikimadrid-${id}.${ext}`;a.click();toast('Archivo descargado. Ya puedes enviarlo por WhatsApp.');}
  }

  function renderFavorites(){
    const items=allItems.filter(x=>favorites.has(x.id));
    $('#favoritesGrid').innerHTML=items.map(x=>x.kind==='event'?eventCard(x):card(x)).join('');
    $('#favoritesEmpty').hidden=items.length>0;
  }
  function openDetail(id){
    const item=byId[id];if(!item||item.kind==='event')return;
    const tags=item.tags.map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('');
    $('#modalBody').innerHTML=`<div class="modal-hero" style="--accent:${colorFor(item)}">${item.emoji}</div><div class="modal-content"><span class="status confirmado">Ficha verificada</span><h2>${escapeHtml(item.name)}</h2><div class="tag-row">${tags}</div><p>${escapeHtml(item.description)}</p><div class="modal-address"><b>📍 ${escapeHtml(item.address)}</b><br><span>${escapeHtml(item.zone)} · ${escapeHtml(item.budget)}</span></div><div class="modal-actions"><a class="strong" href="${mapUrl(item)}" target="_blank" rel="noopener">Cómo llegar ↗</a><a href="${item.url}" target="_blank" rel="noopener">Web oficial ↗</a><button data-route-add="${item.id}">＋ Mi ruta</button></div><p style="font-size:11px">Fuente: <a href="${item.source}" target="_blank" rel="noopener">consulta original</a>. Revisa horario y disponibilidad antes de desplazarte.</p></div>`;
    $('#detailModal').showModal();
  }

  function bind(){
    document.addEventListener('click',e=>{
      const go=e.target.closest('[data-go]');if(go){if(go.dataset.filterType){state.kind=go.dataset.filterType;$$('[data-kind]').forEach(b=>b.classList.toggle('active',b.dataset.kind===state.kind));}if(go.dataset.rankTarget){rankingType=go.dataset.rankTarget;rankingLimit=25;$$('[data-ranking]').forEach(b=>b.classList.toggle('active',b.dataset.ranking===rankingType));}navigate(go.dataset.go);return}
      const nv=e.target.closest('[data-view]');if(nv){navigate(nv.dataset.view);return}
      const fav=e.target.closest('[data-fav]');if(fav){e.preventDefault();toggleFavorite(fav.dataset.fav);if(byId[fav.dataset.fav]?.kind==='event')renderEvents();return}
      const detail=e.target.closest('[data-detail]');if(detail){openDetail(detail.dataset.detail);return}
      const uni=e.target.closest('[data-universe]');if(uni){resetFilters();state.tags.add(uni.dataset.universe);$$('#tagFilters input').forEach(i=>i.checked=norm(i.value)===norm(uni.dataset.universe));navigate('explorar');return}
      const kind=e.target.closest('[data-kind]');if(kind){state.kind=kind.dataset.kind;$$('[data-kind]').forEach(b=>b.classList.toggle('active',b===kind));renderExplore();return}
      const dis=e.target.closest('[data-display]');if(dis){state.display=dis.dataset.display;$$('[data-display]').forEach(b=>b.classList.toggle('active',b===dis));renderExplore();return}
      const ef=e.target.closest('[data-event-filter]');if(ef){eventFilter=ef.dataset.eventFilter;$$('[data-event-filter]').forEach(b=>b.classList.toggle('active',b===ef));renderEvents();return}
      const rd=e.target.closest('[data-rank-detail]');if(rd){openRankingDetail(rd.dataset.rankDetail);return}
      const rt=e.target.closest('[data-ranking]');if(rt){rankingType=rt.dataset.ranking;rankingLimit=25;$$('[data-ranking]').forEach(b=>b.classList.toggle('active',b===rt));renderRankings();return}
      const cp=e.target.closest('[data-copy-title]');if(cp){navigator.clipboard?.writeText(cp.dataset.copyTitle);toast('Título copiado');return}
      const cal=e.target.closest('[data-calendar]');if(cal){const item=byId[cal.dataset.calendar];downloadBlob(eventIcs([item]),`${item.id}.ics`,'text/calendar');toast('Evento añadido como archivo de calendario');return}
      const sm=e.target.closest('[data-sticker-mode]');if(sm){stickerMode=sm.dataset.stickerMode;mediaLimit=40;$$('[data-sticker-mode]').forEach(b=>b.classList.toggle('active',b===sm));renderStickers();return}
      const ss=e.target.closest('[data-share-sticker]');if(ss){shareSticker(ss.dataset.shareSticker);return}
      const add=e.target.closest('[data-route-add]');if(add){addToRoute(add.dataset.routeAdd);$('#detailModal').close();return}
      const rem=e.target.closest('[data-route-remove]');if(rem){customRoute=customRoute.filter(x=>x!==rem.dataset.routeRemove);persist();renderCustomRoute();return}
    });
    $('#favoritesBtn').addEventListener('click',()=>navigate('favoritos'));
    $('#clearFilters').addEventListener('click',resetFilters);$('#emptyReset').addEventListener('click',resetFilters);
    $('#searchInput').addEventListener('input',e=>{state.query=e.target.value;renderExplore()});
    $('#zoneFilter').addEventListener('change',e=>{state.zone=e.target.value;renderExplore()});
    $('#budgetFilter').addEventListener('change',e=>{state.budget=e.target.value;renderExplore()});
    $('#favOnly').addEventListener('change',e=>{state.favOnly=e.target.checked;renderExplore()});
    $('#tagFilters').addEventListener('change',e=>{if(!e.target.matches('input'))return;e.target.checked?state.tags.add(e.target.value):state.tags.delete(e.target.value);renderExplore()});
    $('.modal-close').addEventListener('click',()=>$('#detailModal').close());
    $('#detailModal').addEventListener('click',e=>{if(e.target===$('#detailModal'))$('#detailModal').close()});
    $('#downloadAllCalendar').addEventListener('click',()=>downloadBlob(eventIcs(D.events),'agenda-frikimadrid.ics','text/calendar'));
    $('#rankingSearch').addEventListener('input',e=>{rankingQuery=e.target.value;rankingLimit=25;renderRankings()});
    $('#rankingLoadMore').addEventListener('click',()=>{rankingLimit+=25;renderRankings()});
    $('#mediaSearch').addEventListener('input',e=>{mediaQuery=e.target.value;mediaLimit=40;renderStickers()});
    $('#mediaGroup').addEventListener('change',e=>{mediaGroup=e.target.value;mediaLimit=40;renderStickers()});
    $('#mediaLoadMore').addEventListener('click',()=>{mediaLimit+=40;renderStickers()});
    document.addEventListener('click',e=>{if(e.target.id==='clearRoute'){customRoute=[];persist();renderCustomRoute()}});
    $('#shareApp').addEventListener('click',async()=>{try{await navigator.share({title:'FrikiMadrid',text:'Tiendas, sitios, eventos y stickers frikis de Madrid',url:location.href})}catch{await navigator.clipboard?.writeText(location.href);toast('Enlace copiado')}});
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').hidden=false});
    const install=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('#installBtn').hidden=true}else toast('En el navegador, usa “Añadir a pantalla de inicio”')};
    $('#installBtn').addEventListener('click',install);$('#footerInstall').addEventListener('click',install);
  }
  function init(){
    setupFilters();renderHome();renderExplore();renderEvents();renderRoutes();renderRankings();renderStickers();updateFavCount();bind();
    const hash=location.hash.replace('#','');if($(`[data-view-panel="${hash}"]`))navigate(hash,false);
    if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
  init();
})();
