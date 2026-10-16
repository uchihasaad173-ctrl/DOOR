/* THE DOOR — Just One More Kiss 💋
   Vanilla JS, no libraries. Sections: helpers → audio → particles → scenes → boot */

const $ = s => document.querySelector(s);
const scenes = [...document.querySelectorAll('.scene')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Helpers ---------- */
let token = 0;   // bumped on restart so old async sequences stop silently
let current = -1;

// Wait ms; throws if a restart happened meanwhile (caught in run())
async function sleep(ms) {
  const t = token;
  await new Promise(r => setTimeout(r, reduced ? Math.min(ms, 60) : ms));
  if (t !== token) throw new Error('cancelled');
}
const run = fn => fn().catch(e => { if (e.message !== 'cancelled') console.error(e); });

// Add lines to a box, one by one. Each item: "text" or [text, extraClass]
async function reveal(box, lines, gap = 2200, cls = '') {
  for (const l of lines) {
    const [text, extra] = Array.isArray(l) ? l : [l, ''];
    const p = document.createElement('p');
    p.className = `line ${cls} ${extra}`;
    p.textContent = text;
    box.appendChild(p);
    void p.offsetWidth;            // force reflow so the transition plays
    p.classList.add('show');
    await sleep(gap);
  }
}

// Create a button inside a container; resolves click via callback
function button(parent, text, onClick, extra = '') {
  const b = document.createElement('button');
  b.className = `cta ${extra}`;
  b.textContent = text;
  b.addEventListener('click', onClick);
  parent.appendChild(b);
  void b.offsetWidth;
  b.classList.add('show');
  return b;
}
const actions = box => { const d = document.createElement('div'); d.className = 'actions'; box.appendChild(d); return d; };

// Go to a scene (0-based), update mood + progress, start its sequence
function goTo(i) {
  current = i;
  playSceneAudio(i);
  scenes.forEach((s, n) => s.classList.toggle('active', n === i));
  document.body.className = 'mood-' + scenes[i].dataset.mood;
  $('#progress').style.width = ((i + 1) / scenes.length * 100) + '%';
  run(sequences[i]);
}
const next = () => goTo(current + 1);

// Floating hearts burst (full screen)
function hearts(n = 40) {
  for (let i = 0; i < n; i++) {
    const h = document.createElement('div');
    h.className = 'heart';
    h.textContent = ['❤','💗','💋','💖'][i % 4];
    h.style.left = Math.random() * 100 + 'vw';
    h.style.fontSize = (18 + Math.random() * 34) + 'px';
    h.style.animationDuration = (4 + Math.random() * 4) + 's';
    h.style.animationDelay = (Math.random() * 1.2) + 's';
    document.body.appendChild(h);
    setTimeout(() => h.remove(), 10000);
  }
}

/* ---------- Audio ---------- */
let ctx = null, soundOn = true, beatTimer = null, currentTrack = -1;
const audioTrack = new Audio();
audioTrack.preload = 'auto';
audioTrack.loop = true;

function playSceneAudio(sceneIndex) {
  const trackIndex = sceneIndex % 3;
  if (trackIndex !== currentTrack) {
    currentTrack = trackIndex;
    const source = document.createElement('source');
    source.src = `A${trackIndex + 1}.mpeg`;
    source.type = 'audio/mpeg';
    audioTrack.replaceChildren(source);
    audioTrack.load();
  }
  audioTrack.muted = !soundOn;
  if (soundOn) audioTrack.play().catch(() => {});
}

function startAudio() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  ctx.resume();
}
function thump(t, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.25);
}
// Heartbeat "lub-dub" – only during the tense scenes (1 and 5)
function startHeartbeat() {
  stopHeartbeat();
  beatTimer = setInterval(() => {
    if (!ctx || !soundOn) return;
    thump(ctx.currentTime, 0.5); thump(ctx.currentTime + 0.22, 0.35);
  }, 1100);
}
function stopHeartbeat() { clearInterval(beatTimer); }

$('#music').addEventListener('click', () => {
  soundOn = !soundOn;
  $('#music').textContent = soundOn ? '♪ on' : '♪ off';
  audioTrack.muted = !soundOn;
  if (soundOn && current >= 0) audioTrack.play().catch(() => {});
});

/* ---------- Particles (glowing embers on a canvas) ---------- */
const cv = $('#fx'), c = cv.getContext('2d');
let dots = [];
function resize() { cv.width = innerWidth; cv.height = innerHeight; }
addEventListener('resize', resize); resize();
for (let i = 0; i < (reduced ? 20 : 70); i++) dots.push({
  x: Math.random() * innerWidth, y: Math.random() * innerHeight,
  r: Math.random() * 2.2 + .6, v: Math.random() * .35 + .1, a: Math.random() * .6 + .2, p: Math.random() * 6
});
function draw(t) {
  c.clearRect(0, 0, cv.width, cv.height);
  for (const d of dots) {
    d.y -= reduced ? 0 : d.v; d.x += Math.sin(t / 2000 + d.p) * .2;
    if (d.y < -10) { d.y = cv.height + 10; d.x = Math.random() * cv.width; }
    const g = c.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 6);
    g.addColorStop(0, `rgba(255,110,150,${d.a})`); g.addColorStop(1, 'rgba(163,18,47,0)');
    c.fillStyle = g; c.beginPath(); c.arc(d.x, d.y, d.r * 6, 0, 7); c.fill();
  }
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

/* ---------- Scene sequences ---------- */
const sequences = [

  // 1 — REMEMBER THE DOOR?
  async function () {
    const b = $('#b1'); b.innerHTML = '';
    startHeartbeat();
    await sleep(2500);
    await reveal(b, [['Shahd...', 'title'], 'Do you remember what happened at your door?'], 2800);
    const a = actions(b);
    button(a, 'How could I forget? 👀', () => run(async () => {
      a.remove();
      await reveal(b, [
        'We were supposed to say goodbye...',
        'But somehow, neither of us seemed ready to.',
        'And then... we kissed. 💋'], 2800);
      await sleep(1500); stopHeartbeat(); next();
    }));
  },

  // 2 — REPLAY OUR FIRST KISS
  async function () {
    const b = $('#b2'); b.innerHTML = '';
    const story = [
      'The way we got closer...',
      'The way I held you...',
      'The moment I lifted you up just to kiss you again...',
      'And suddenly, saying goodbye became the last thing on my mind.'];
    const play = async (first) => {
      b.classList.remove('playing'); void b.offsetWidth; b.classList.add('playing');
      b.innerHTML = '';
      await reveal(b, story, 2800);
      const a = actions(b);
      button(a, 'Replay that moment ❤️', () => run(async () => { a.remove(); hearts(30); await sleep(1200); await play(false); }));
      button(a, 'Continue →', () => next());
    };
    await play(true);
  },

  // 3 — THE FLIRTY INTERROGATION
  async function () {
    const b = $('#b3'); b.innerHTML = '';
    await reveal(b, [["Okay, Shahd. It's your turn to be honest.", 'title']], 2600);
    const quiz = [
      { q: 'If I were standing in front of you right now...', o: [
        ["I'd hug you first. 🫂", "Mmm. Starting soft. I like it. Just warning you: I'm terrible at letting go."],
        ["I'd pull you closer. ❤️", "Bold. Dangerous. Exactly the answer I was hoping for."],
        ["I'd let you guess. 😏", "Oh, you want me to work for it? Challenge accepted."]] },
      { q: 'And if I leaned in for another kiss?', o: [
        ["I'd kiss you back. 💋", "Good. Because I wasn't planning on asking twice."],
        ["I'd smile first and make you wait. 🙈", "Cruel. And somehow I'd still wait for you."],
        ["Maybe you should find out in person. 😈", "Careful, Shahd. I take invitations very seriously."]] },
      { q: 'What\'s the most dangerous thing about seeing me again?', o: [
        ["You might steal another kiss.", "Guilty in advance. Consider yourself warned. 💋"],
        ["I might not want to let you go.", "Then don't. I'd hold on just as long. ❤️"],
        ["We might forget what we were supposed to be doing. 😏", "Honestly? Forgetting everything else sounds perfect."]] }
    ];
    for (let i = 0; i < quiz.length; i++) {
      await sleep(600);
      const card = document.createElement('div'); card.className = 'box';
      b.appendChild(card);
      await reveal(card, [quiz[i].q], 1400);
      const a = actions(card);
      await new Promise(done => {
        quiz[i].o.forEach(([label, reply]) => button(a, label, () => run(async () => {
          [...a.children].forEach(x => x.classList.add('off'));
          await reveal(card, [[reply, 'reply']], 2600);
          done();
        })));
      });
      await sleep(400);
      card.style.transition = 'opacity 1s'; card.style.opacity = '0.0';
      await sleep(1000); card.remove();
    }
    await reveal(b, ['You are impossible. 😏'], 2000);
    button(actions(b), 'Next →', () => next());
  },

  // 4 — THE SECRET LETTER
  async function () {
    const env = $('#envelope'), letter = $('#letter'), a = $('#a4');
    env.className = 'envelope'; letter.innerHTML = ''; a.innerHTML = '';
    $('#envText').textContent = '';
    await sleep(800);
    $('#envText').textContent = "Shahd, there's something I haven't told you...";
    env.classList.add('show');
    await new Promise(done => {
      const open = () => { env.removeEventListener('click', open); done(); };
      env.addEventListener('click', open);
      env.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') open(); };
    });
    env.classList.add('open'); hearts(10);
    await sleep(1600);
    env.classList.add('read');
    const text = [
      ["You know what's unfair, Shahd?"],
      ["Now I have a memory that makes me smile like an idiot whenever I think about it."],
      ["The way I held you. The way we kissed. The moment I lifted you up because I wanted another moment with you."],
      ["You have absolutely no idea what you've done to me.", 'em'],
      ["Because now, every time I think about seeing you again, I remember that moment..."],
      ["And wish I could relive it."],
      ["One kiss with you was enough to make me want another.", 'em'],
      ["And another."], ["And another. ❤️💋", 'em']];
    for (const [t, cls] of text) {
      const p = document.createElement('p'); p.textContent = t; if (cls) p.className = cls;
      letter.appendChild(p); void p.offsetWidth; p.classList.add('show');
      p.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
      await sleep(2300);
    }
    hearts(14);
    button(a, 'Keep reading →', () => next());
  },

  // 5 — THE TENSION BUILDS
  async function () {
    const b = $('#b5'); b.innerHTML = '';
    startHeartbeat();
    await sleep(2500);
    await reveal(b, [['Shahd...', 'title'], 'When I see you again...'], 3000);
    await sleep(2200);
    await reveal(b, [['What are you claiming first? 👀', 'title']], 2000);
    const a = actions(b);
    const choices = [
      ['One more kiss. 💋', "Just one? ...Sure. We'll start with one. 😌💋"],
      ['Hold me a little longer. ❤️', "Then I'll hold you until you tell me to stop. Don't tell me to stop."],
      ["Both. Don't make me choose. 😈", "Well, look at you making plans already. 😏❤️"]];
    choices.forEach(([label, reply]) => button(a, label, () => run(async () => {
      [...a.children].forEach(x => x.classList.add('off'));
      hearts(12);
      await reveal(b, [[reply, 'reply']], 3200);
      await sleep(1200); stopHeartbeat(); next();
    }), 'big'));
  },

  // 6 — FINAL SCENE
  async function () {
    const b = $('#b6'); b.innerHTML = '';
    await reveal(b, [
      'Some moments last only a few seconds...',
      'But somehow, they stay in your head for days.',
      'Our moment at your door became one of mine.',
      'And if I get to see you again...',
      'I already know one thing.',
      ['I owe you another kiss, beautiful. 💋', 'title'],
      'Let\'s take our time this time.'], 2700);
    button(actions(b), 'COME GET YOUR KISS, SAAD 💋', () => run(async () => {
      hearts(70);
      await sleep(1800);
      $('#finaleText').textContent = 'Now stop smiling at your screen and come see me. ❤️';
      $('#finale').classList.add('show');
    }), 'big');
  }
];

/* ---------- Restart + boot ---------- */
function restart() {
  token++;                                // cancels any running sequence
  stopHeartbeat();
  $('#finale').classList.remove('show');
  setTimeout(() => goTo(0), 300);
}
$('#restart').addEventListener('click', restart);
$('#again').addEventListener('click', restart);

$('#begin').addEventListener('click', () => {
  startAudio();                           // audio only after a user click
  playSceneAudio(0);
  $('#gate').classList.add('gone');
  $('#bar').classList.remove('hidden');
  setTimeout(() => goTo(0), 600);
});
