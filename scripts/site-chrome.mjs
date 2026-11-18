import fs from 'node:fs';
import {createHash} from 'node:crypto';
const revision=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0,12);
export const siteScriptUrl=()=>`/site.js?v=${revision('dist/site.js')}`;
const placesUrl=()=>`/places-data.json?v=${revision('dist/places-data.json')}`;
const logo=`<svg viewBox="0 0 42 42" aria-hidden="true"><circle cx="21" cy="21" r="19" fill="none" stroke="currentColor" stroke-width=".8"/><path d="M8 27q7-7 14-3t13-1M8 31q7-7 14-3t13-1M14 20V12h5v9m3-1V8h4v12m3 0v-6h4v9" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="11" cy="12" r="1.7" fill="currentColor"/></svg>`;
const magnifier=`<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="m12 12 5 5"/></svg>`;
export function siteHeader(route='/'){
 const links=[['/','Explore the map'],['/places/','Explore the list']].map(([href,label])=>{const active=href==='/'?route==='/':route.startsWith(href);return `<a href="${href}"${active?` class="active" aria-current="${route===href?'page':'location'}"`:''}>${label}</a>`}).join('');
 return `<header class="site-header" data-site-script="${siteScriptUrl()}" data-places-url="${placesUrl()}"><a class="brand" href="/" aria-label="Lakefront Trail home">${logo}<span>Lakefront Trail<small>CHICAGO · AN ILLUSTRATED ATLAS</small></span></a><nav class="desktop-nav" aria-label="Main navigation">${links}</nav><button type="button" class="search-trigger" id="search-open" aria-label="Find a place">${magnifier}<span>Find a place</span><kbd>⌘ K</kbd></button><details class="mobile-menu"><summary aria-label="Open navigation"><span></span><span></span></summary><nav aria-label="Mobile navigation">${links}</nav></details></header>`;
}
export function siteFooter(){
 return `<footer class="site-footer"><div class="footer-signature"><a class="brand-word" href="/">Lakefront Trail</a><p>The end of the trail.<br><em>The beginning of a love affair.</em></p></div><div class="footer-details"><nav aria-label="Footer navigation"><a href="/">Explore the map</a><a href="/places/">Explore the list</a><a href="/credits/">About & credits</a></nav><p class="site-credit">Designed by <a href="https://oddlogicstudio.com/" target="_blank" rel="noopener">OddLogic Studio</a> <span aria-hidden="true">·</span> Powered by <a href="https://oddlogic.ai/" target="_blank" rel="noopener">OddLogic AI</a></p></div></footer>`;
}
export function siteSearch(count){
 return `<dialog class="search-dialog" id="search-dialog" aria-labelledby="search-title"><div class="dialog-top"><p class="eyebrow" id="search-title">FIND YOUR NEXT DISCOVERY</p><button type="button" class="close-button" data-close="search-dialog" aria-label="Close search">×</button></div><label class="search-input-wrap">${magnifier}<input id="search-input" type="search" placeholder="A statue, a theater, a beach…" autocomplete="off" aria-label="Search lakefront places" aria-controls="search-results"></label><p class="search-count" id="search-count" aria-live="polite"></p><div id="search-results" class="search-results"></div><div class="search-footer">${count} discoveries · 18 miles of possibility <span>ESC TO CLOSE</span></div></dialog>`;
}
