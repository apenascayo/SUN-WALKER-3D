const paths = {
    sword: '<path d="M7 5l13 13M17 5L4 18M6 3l2 1 1 4-2 2-3-4zM18 3l-2 1-1 4 2 2 3-4zM3 16l5 5M16 21l5-5"/>',
    gun: '<path d="M3 8h17l2-2v7l-2-2h-8l-1 7-3 2-2-1 1-8H3zM11 12l2 3h2"/>',
    scythe: '<path d="M8 21L17 4M16 5c4-3 7 0 6 4-1-2-3-3-6-2M14 5h-3v3h3"/>',
    fire: '<path d="M13 2c1 5-4 5-2 9 2-1 3-3 3-4 5 4 6 8 3 12-4 5-11 2-11-3 0-3 2-6 4-8-1 4 1 5 1 5"/>',
    storm: '<path d="M13 2L5 13h6l-1 9 9-12h-6z"/>',
    magnet: '<path d="M5 4v9a7 7 0 0014 0V4h-5v9a2 2 0 01-4 0V4zM5 8h5M14 8h5"/>',
    potion: '<path d="M10 3h4v4l3 3v9a2 2 0 01-2 2H9a2 2 0 01-2-2v-9l3-3zM9 14h6M12 11v6"/>',
    ammo: '<path d="M4 8h16v12H4zM6 8l2-4h8l2 4M8 12v5M12 12v5M16 12v5"/>',
    hat: '<path d="M3 16l9-10 9 10zM3 16c3 2 15 2 18 0M12 6v10"/>',
    palha: '<path fill="#dcae4a" stroke="#f4d38b" d="M2 16L12 5l10 11z"/><path stroke="#876238" d="M5 15h14M8 11h8M3 17q9 3 18 0"/>',
    negro: '<path fill="#292c31" stroke="#9e9e9e" d="M2 15L12 5l10 10-10 3z"/><path d="M7 17l-1 5M17 17l1 5" stroke="#b9b8b2"/>',
    couro: '<path fill="#995927" stroke="#e2bb8a" d="M7 13V9a5 5 0 0110 0v4zM2 14q10-4 20 0-1 3-10 3T2 14z"/><path d="M7 13h10" stroke="#f2d5a9"/>',
    mino: '<path fill="#af8951" stroke="#e3c28b" d="M6 9L12 3l6 6 2 11-2 2H6l-2-2z"/><path d="M6 9h12M7 12l-1 8m5-8-1 9m4-9 1 9m3-9 1 8" stroke="#70542f"/>',
    kabuto: '<path fill="#252222" stroke="#d3a758" d="M5 11Q5 4 12 4t7 7v7l-3 3H8l-3-3z"/><path d="M7 6L5 2M17 6l2-4M7 11h10" stroke="#d9a83b"/><path fill="#eee1c3" d="M8 14h8v6H8z"/><path stroke="#3a201a" d="M9 16h1m4 0h1m-4 3h2"/>',
    tengu: '<path fill="#a3261c" stroke="#f0a291" d="M5 7Q5 3 12 3t7 4v10l-3 4H8l-3-4z"/><path fill="#d34d37" d="M11 10h2l2 5-4 1z"/><path stroke="#fff4e5" d="M7 9l3 1m4 0 3-1M9 18h6"/>',
    oni: '<path fill="#bbc2c3" stroke="#eff4ee" d="M5 8Q5 4 12 4t7 4v9l-3 4H8l-3-4z"/><path fill="#caa64f" stroke="#f2d57c" d="M6 7L4 2l4 4m10 1 2-5-4 4"/><path stroke="#352e2a" d="M7 10l3 1m4 0 3-1M8 17h8"/><path fill="#f3e8c8" d="M8 16l1 3 1-3m4 0 1 3 1-3"/>',
    shirt: '<path d="M8 4l4 2 4-2 5 4-3 4-2-1v9H8v-9l-2 1-3-4z"/>'
};

export function icon(name) {
    return '<svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
}
