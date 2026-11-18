const $=selector=>document.querySelector(selector);
const escape=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const symbols={beach:'≈',nature:'♧',harbor:'⚓',landmark:'◇'};
const closeMobileMenu=()=>{const menu=$('.mobile-menu');if(menu)menu.open=false};

document.addEventListener('click',event=>{
 const menu=event.target.closest('.mobile-menu');
 if(!menu||event.target.closest('a'))closeMobileMenu();
});
document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMobileMenu()});

export function initSiteSearch({places,onSelect=id=>location.assign(`/?place=${encodeURIComponent(id)}`),beforeOpen=()=>{}}={}){
 const trigger=$('#search-open'),dialog=$('#search-dialog'),input=$('#search-input'),results=$('#search-results'),count=$('#search-count');
 if(!trigger||!dialog||!input||!results||!count)return null;
 if(dialog.siteSearch)return dialog.siteSearch;
 let collection=places??null,error='';
 function render(query=''){
  if(error||!collection){count.textContent=error?'Places could not load':'Loading discoveries…';results.innerHTML=`<p class="empty-search">${error?'Please reload the page and try again.':'Finding the places along the lakefront…'}</p>`;return}
  const q=query.toLowerCase().trim();
  const matches=collection.filter(place=>[place.name,place.category,place.subtype,...(place.aliases??[]),place.description,place.regionName,place.id,place.id==='osterman-beach'?'Hollywood':''].join(' ').toLowerCase().includes(q));
  count.textContent=q?`${matches.length} ${matches.length===1?'discovery':'discoveries'} found`:'From the northern beaches to South Shore';
  results.innerHTML=matches.length?matches.map(place=>`<button type="button" class="search-result" data-result="${escape(place.id)}"><span>${symbols[place.category]??'◇'}</span><span><strong>${escape(place.name)}</strong><small>${escape(place.regionName)} · ${escape(place.access)}</small></span><span class="result-arrow">↗</span></button>`).join(''):'<p class="empty-search">No places found. Try “beach,” “museum,” or a neighborhood name.</p>';
 }
 function open(){
  closeMobileMenu();beforeOpen();input.value='';render();
  if(!dialog.open)dialog.showModal();
  input.focus();
 }
 trigger.addEventListener('click',open);
 input.addEventListener('input',()=>render(input.value));
 input.addEventListener('keydown',event=>{
  if(event.key==='ArrowDown'){event.preventDefault();results.querySelector('button')?.focus()}
  if(event.key==='Enter'){event.preventDefault();results.querySelector('button')?.click()}
 });
 results.addEventListener('click',event=>{
  const result=event.target.closest('[data-result]');if(!result)return;
  dialog.close();onSelect(result.dataset.result);
 });
 dialog.querySelector('[data-close="search-dialog"]')?.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const rect=dialog.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
 });
 document.addEventListener('keydown',event=>{
  const typing=document.activeElement?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"])');
  if(((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k')||(event.key==='/'&&!typing)){
   event.preventDefault();open();
  }
 });
 const controller={open,setPlaces(value){collection=value;error='';if(dialog.open)render(input.value)},setError(){error='load';if(dialog.open)render(input.value)}};
 dialog.siteSearch=controller;
 return controller;
}

// Editorial pages share discovery search without loading the map or its controls.
if(!$('#atlas')){
 const header=$('.site-header');
 if(header?.dataset.placesUrl){
  const search=initSiteSearch();
  if(search)fetch(header.dataset.placesUrl).then(response=>{
   if(!response.ok)throw new Error(`Discovery data returned ${response.status}`);
   return response.json();
  }).then(places=>{
   if(!Array.isArray(places))throw new Error('Discovery data is not a list');
   search.setPlaces(places);
  }).catch(()=>search.setError());
 }
}
