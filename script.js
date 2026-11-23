'use strict';
const slides = Array.from(document.querySelectorAll('.slide'));
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const nextButton = document.querySelector('#next');
const prevButton = document.querySelector('#prev');
const screenButton = document.querySelector('#fullscreen');
const nav = document.querySelector('#chapters');
let current = 0;
let running = [];
let origin = null;
const sourceDialog = document.querySelector('#sources-dialog');
const sourceTemplates = Array.from(document.querySelectorAll('.slide-sources'));
document.querySelector('#sources-open').addEventListener('click', () => {
  document.querySelector('#sources-chapter').textContent = String(current + 1).padStart(2, '0') + ' / 08 · ' + slides[current].dataset.name;
  document.querySelector('#sources-list').replaceChildren(sourceTemplates[current].content.cloneNode(true));
  sourceDialog.showModal();
  sourceDialog.scrollTop = 0;
});
sourceDialog.addEventListener('click', event => {
  if (event.target !== sourceDialog) return;
  const rect = sourceDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) sourceDialog.close();
});

const sketches = {
  restore: '<path d="M22 108V44h115v64M17 44h126v-6H17zm11-6v-5h104v5M32 108V79a13 13 0 0 1 26 0v29m14 0V79a13 13 0 0 1 26 0v29m14 0V79a8 8 0 0 1 16 0v29M20 53h119M22 62h113"/><path class="red" d="m78 43-4 8 4 6-5 8m-5-16 14 5m-15 1 14 5M64 30V16h42"/>',
  protect: '<path d="m27 76 51-27 49 24-49 27zM39 74V49l39-21 38 18v28M39 49l38 17 39-20M77 66v24M44 47l33-17 35 16-35 16z"/><path class="red" stroke-dasharray="5 3" d="m9 80 67-37 72 34-70 38zM9 80V47l67-37 72 34v33"/>',
  design: '<path d="M8 108h144M14 107V68h42v39m-46-39h50v-5H10zm10 13h8v12h-8zm20 0h8v12h-8zM65 108V68h24V49h25V32h32v76m-77-35h73M94 55h48m-24-17h24M72 82h65m-65 11h65"/><path class="red" stroke-dasharray="4 3" d="M5 63h91m-40 0 88-42"/>',
  reuse: '<path d="M19 27h121v77H19zM25 33h27v32H25zm0 38h27v27H25zm34-38h75v24H59zm21 31h54v34H80zM59 61v37h14M35 27v6m60-6v6m-15 36h-7m-14 9h-7"/><path class="red" d="M18 87H7V18h98m-6-5 6 5-6 5M60 78V63a15 15 0 0 1 15 15z"/>'
};
for (const host of document.querySelectorAll('[data-drawing]')) {
  host.innerHTML = '<svg viewBox="0 0 160 125" aria-hidden="true"><defs><pattern id="grid-' + host.dataset.drawing + '" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0v10" fill="none" stroke="#cbbfaf" stroke-width=".5"/></pattern></defs><rect x="2" y="4" width="155" height="114" fill="url(#grid-' + host.dataset.drawing + ')"/><g fill="none" stroke="#62584d" stroke-width="1.4" stroke-linejoin="round">' + sketches[host.dataset.drawing] + '</g></svg>';
}
const indicators = slides.map((slide, index) => {
  const button = document.createElement('button');
  button.setAttribute('aria-label', (index + 1) + ' · ' + slide.dataset.name);
  button.title = slide.dataset.name;
  button.addEventListener('click', () => go(index));
  nav.append(button);
  return button;
});
function update() {
  slides.forEach((slide, index) => {
    slide.inert = index !== current;
    slide.setAttribute('aria-hidden', String(index !== current));
    indicators[index].setAttribute('aria-current', String(index === current));
  });
  document.querySelector('#count').textContent = String(current + 1).padStart(2, '0');
  document.querySelector('#chapter-name').textContent = slides[current].dataset.name;
  document.querySelector('#announce').textContent = (current + 1) + ' / 8 · ' + slides[current].dataset.name;
  prevButton.disabled = current === 0;
  nextButton.disabled = current === slides.length - 1;
}
const shapes = [
  ['inset(0 0 0 100%)', 'inset(0 0 0 0%)'],
  ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'],
  ['polygon(108% 0,108% 0,100% 100%,100% 100%)','polygon(0% 0,108% 0,100% 100%,-8% 100%)'],
  ['inset(0 49.9% 0 49.9%)','inset(0 0% 0 0%)'],
  ['inset(100% 0 0 0)','inset(0% 0 0 0)'],
  ['circle(0% at 65% 65%)','circle(145% at 65% 65%)'],
  ['inset(47% 0 52% 0)','inset(0% 0 0% 0)']
];
function clearTransition() {
  for (const anim of running) { anim.onfinish = null; anim.cancel(); }
  running = [];
  slides.forEach(slide => slide.classList.remove('leaving'));
}
function go(target) {
  if (target === current || target < 0 || target >= slides.length) return;
  clearTransition();
  const previous = current;
  const old = slides[current];
  const next = slides[target];
  if (old.contains(document.activeElement)) indicators[target].focus({preventScroll:true});
  old.classList.add('leaving');
  old.classList.remove('active');
  current = target;
  next.classList.add('active');
  next.scrollTop = 0;
  update();
  if (motion.matches) { clearTransition(); return; }
  const forward = target > previous;
  const [closed, open] = shapes[Math.min(previous, target)];
  const options = {duration:800, easing:'cubic-bezier(.62,.02,.18,1)', fill:'both'};
  if (forward) {
    running.push(old.animate([{transform:'scale(1)'},{transform:'scale(1.035)'}], options));
    running.push(next.animate([{clipPath:closed},{clipPath:open}], options));
  } else {
    running.push(next.animate([{transform:'scale(1.035)'},{transform:'scale(1)'}], options));
    running.push(old.animate([{clipPath:open,zIndex:3},{clipPath:closed,zIndex:3}], options));
  }
  running[running.length - 1].onfinish = clearTransition;
}
prevButton.onclick = () => go(current - 1);
nextButton.onclick = () => go(current + 1);
async function fullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { document.querySelector('#announce').textContent = 'Ամբողջ էկրանի ռեժիմն անհասանելի է։'; }
}
screenButton.hidden = !document.fullscreenEnabled;
screenButton.onclick = fullscreen;
document.addEventListener('fullscreenchange', () => {
  const label = document.fullscreenElement ? 'Դուրս գալ ամբողջ էկրանից' : 'Ամբողջ էկրան';
  screenButton.title = label;
  screenButton.setAttribute('aria-label', label);
});
document.addEventListener('keydown', event => {
  if (sourceDialog.open) return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.code === 'KeyF' && !event.repeat) { fullscreen(); return; }
  if (event.target.matches('input') || event.repeat) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    go(current + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
let wheelLast = -Infinity, wheelSum = 0, wheelUsed = false;
document.addEventListener('wheel', event => {
  if (sourceDialog.open) return;
  if (event.ctrlKey || event.target.matches('input')) return;
  const slide = slides[current];
  if (slide.scrollHeight > slide.clientHeight + 1 && ((event.deltaY > 0 && slide.scrollTop + slide.clientHeight < slide.scrollHeight - 1) || (event.deltaY < 0 && slide.scrollTop > 1))) return;
  event.preventDefault();
  const now = performance.now();
  if (now - wheelLast > 225) { wheelSum = 0; wheelUsed = false; }
  wheelLast = now;
  if (wheelUsed) return;
  const amount = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  wheelSum += amount * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
  if (Math.abs(wheelSum) >= 26) { wheelUsed = true; go(current + Math.sign(wheelSum)); }
}, {passive:false});
const deck = document.querySelector('#deck');
deck.addEventListener('touchstart', event => {
  origin = null;
  if (!event.target.closest('.compare') && event.touches.length === 1) {
    origin = [event.touches[0].clientX,event.touches[0].clientY];
  }
}, {passive:true});
deck.addEventListener('touchcancel', () => { origin = null; });
deck.addEventListener('touchend', event => {
  if (!origin) return;
  const x = event.changedTouches[0].clientX - origin[0];
  const y = event.changedTouches[0].clientY - origin[1];
  origin = null;
  if (Math.abs(x) > 40 && Math.abs(x) > Math.abs(y) * 1.25) go(current - Math.sign(x));
}, {passive:true});
const range = document.querySelector('#compare-range');
range.addEventListener('input', () => {
  range.parentElement.style.setProperty('--split', range.value + '%');
  range.setAttribute('aria-valuetext', range.value + ' տոկոս');
});
const hover = matchMedia('(hover:hover) and (pointer:fine)');
const gallery = document.querySelector('.gallery');
gallery.addEventListener('pointermove', event => {
  if (!hover.matches || motion.matches) return;
  const bounds = gallery.getBoundingClientRect();
  gallery.style.setProperty('--dx', ((event.clientX-bounds.left)/bounds.width-.5)*10+'px');
  gallery.style.setProperty('--dy', ((event.clientY-bounds.top)/bounds.height-.5)*7+'px');
});
gallery.addEventListener('pointerleave', () => {gallery.style.removeProperty('--dx');gallery.style.removeProperty('--dy');});
motion.addEventListener('change', clearTransition);
update();
for (const url of ['assets/courtyard.svg','assets/courtyard-line.svg']) { const img = new Image(); img.src = url; }

