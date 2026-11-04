export const $ = id => document.getElementById(id);

let toastT;
export function toast(s) {
    const t = $('toast'); t.textContent = s; t.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => t.style.opacity = 0, 1600);
}

export function banner(t, sub, ms) {
    const b = $('bn'); b.innerHTML = '<h2>' + t + '</h2><p>' + (sub || '') + '</p>'; b.classList.add('on'); clearTimeout(banner.h); banner.h = setTimeout(() => b.classList.remove('on'), ms || 2000);
}

export function showModal(n) { $('mc').replaceChildren(n); $('modal').classList.remove('hide') }

export function coinPop() { const c = $('coins'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop') }

export function hpHit() { const b = document.querySelector('.bar.hp'); b.classList.remove('hit'); void b.offsetWidth; b.classList.add('hit') }
