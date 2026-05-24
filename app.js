/* ============================================================
   app.js — shared logic for all pages
   ============================================================ */

// ── KEYS ──
const KEYS = {
  posts:    'rdt_posts',
  projects: 'rdt_projects',
  progress: 'rdt_progress',
  streak:   'rdt_streak',
  photos:   'rdt_photos',
  guests:   'rdt_guests',
  status:   'rdt_status',
};

// ── STORAGE ──
const DB = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  push: (k, item) => {
    const arr = DB.get(k) || [];
    arr.unshift(item);
    DB.set(k, arr);
    return arr;
  },
  update: (k, id, data) => {
    const arr = DB.get(k) || [];
    const i = arr.findIndex(x => x.id === id);
    if (i >= 0) { arr[i] = { ...arr[i], ...data }; DB.set(k, arr); }
    return arr;
  },
  remove: (k, id) => {
    const arr = (DB.get(k) || []).filter(x => x.id !== id);
    DB.set(k, arr);
    return arr;
  }
};

// ── ID GEN ──
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ── DATE UTILS ──
const fmt = {
  date: d => new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' }),
  dateShort: d => new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }),
  relative: d => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'baru saja';
    if (m < 60) return m + ' menit lalu';
    const h = Math.floor(m / 60);
    if (h < 24) return h + ' jam lalu';
    const days = Math.floor(h / 24);
    if (days < 7) return days + ' hari lalu';
    return fmt.dateShort(d);
  }
};

// ── READING TIME ──
const readTime = text => Math.max(1, Math.ceil(text.replace(/<[^>]+>/g,'').split(/\s+/).length / 200)) + ' mnt';

// ── NAVBAR ACTIVE ──
function initNavbar() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ── SCROLL REVEAL ──
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ── TOAST ──
function toast(msg, type = 'default') {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '_toast';
    t.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:9999;
      font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:600;
      padding:12px 20px;border-radius:8px;
      opacity:0;transform:translateY(10px);
      transition:all 0.3s ease;pointer-events:none;
      max-width:280px;line-height:1.4;
    `;
    document.body.appendChild(t);
  }
  const colors = {
    default: '#1e293b',
    success: '#065f46',
    error:   '#7f1d1d',
    info:    '#1e3a5f'
  };
  t.style.background = colors[type] || colors.default;
  t.style.color = '#e2e8f0';
  t.style.border = `1px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'}`;
  t.textContent = msg;
  requestAnimationFrame(() => {
    t.style.opacity = '1';
    t.style.transform = 'translateY(0)';
  });
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(10px)';
  }, 3000);
}

// ── MARKDOWN (lightweight) ──
function parseMarkdown(md) {
  return md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,   '<em>$1</em>')
    .replace(/`(.+?)`/g,     '<code>$1</code>')
    .replace(/^> (.+)$/gm,   '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm,   '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, s => '<ul>' + s + '</ul>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<[hublipa])/gm, '')
    .replace(/(<\/h[123]>|<\/ul>|<\/blockquote>)/g, '$1')
    .replace(/^([^<\n].+)$/gm, '<p>$1</p>');
}

// ── STREAK ──
function updateStreak() {
  const today = new Date().toDateString();
  let s = DB.get(KEYS.streak) || { count: 0, last: null, history: [] };
  if (s.last === today) return s;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (s.last === yesterday) {
    s.count++;
  } else if (s.last !== today) {
    s.count = 1;
  }
  s.last = today;
  if (!s.history.includes(today)) s.history.push(today);
  DB.set(KEYS.streak, s);
  return s;
}

// ── SEED DATA (jika kosong) ──
function seedIfEmpty() {
  if (!DB.get(KEYS.posts)) {
    DB.set(KEYS.posts, [
      {
        id: uid(), title: 'Belajar Subnetting dari Nol',
        slug: 'belajar-subnetting',
        category: 'TKJ', tags: ['networking','ip','tkj'],
        excerpt: 'Subnetting itu awalnya bikin pusing, tapi kalau udah ngerti polanya jadi seru banget. Di sini gua bahas dari dasar.',
        content: '# Belajar Subnetting\n\nSubnetting itu awalnya bikin pusing, tapi kalau udah ngerti polanya jadi seru banget.\n\n## Apa itu IP Address?\n\nIP Address adalah alamat unik setiap perangkat di jaringan. Format: `192.168.1.1`\n\n## Subnet Mask\n\nSubnet mask menentukan bagian network dan host dari IP. Contoh: `255.255.255.0` = `/24`\n\n## Latihan\n\n- Network: `192.168.10.0/24`\n- Jumlah host: 254\n- Broadcast: `192.168.10.255`',
        date: new Date(Date.now() - 86400000*2).toISOString(), views: 42, readTime: '4 mnt'
      },
      {
        id: uid(), title: 'Mulai Belajar Python: Week 1',
        slug: 'python-week-1',
        category: 'Python', tags: ['python','coding','pemula'],
        excerpt: 'Akhirnya mulai belajar Python. Ini catatan minggu pertama gua — dari install sampai bikin program pertama.',
        content: '# Python Week 1\n\nAkhirnya mulai belajar Python setelah lama nunda-nunda.\n\n## Install Python\n\n```\npython --version\n```\n\n## Hello World\n\n```\nprint("Hello, World!")\n```\n\n## Yang Gua Pelajari\n\n- Variables\n- String\n- Integer\n- Input dari user',
        date: new Date(Date.now() - 86400000*5).toISOString(), views: 28, readTime: '3 mnt'
      },
      {
        id: uid(), title: 'Progress Gym: Bulan Pertama',
        slug: 'gym-bulan-1',
        category: 'Gym', tags: ['gym','fitness','lifestyle'],
        excerpt: 'Sebulan gym, berat badan turun 2kg, otot mulai kelihatan. Ini program latihan yang gua pakai.',
        content: '# Gym Bulan Pertama\n\nSebulan gym — ini hasilnya.\n\n## Program Latihan\n\n- **Senin**: Chest & Triceps\n- **Rabu**: Back & Biceps\n- **Jumat**: Legs & Shoulders\n\n## Progress\n\n- Berat awal: 58kg\n- Berat sekarang: 56kg\n- Push-up: 10 → 25 reps',
        date: new Date(Date.now() - 86400000*8).toISOString(), views: 55, readTime: '3 mnt'
      }
    ]);
  }

  if (!DB.get(KEYS.projects)) {
    DB.set(KEYS.projects, [
      {
        id: uid(), title: 'Portfolio Website', type: 'Website',
        desc: 'Portfolio pribadi yang dibangun dengan HTML, CSS, dan JavaScript murni. Responsive, dark mode, dan CMS built-in.',
        tech: ['HTML','CSS','JavaScript'], status: 'live',
        link: 'index.html', date: new Date().toISOString()
      },
      {
        id: uid(), title: 'Jaringan LAN Sekolah', type: 'Networking',
        desc: 'Konfigurasi jaringan LAN sederhana di lab sekolah. IP manual, pengujian koneksi, dan dokumentasi topologi.',
        tech: ['MikroTik','Cisco PT','UTP'], status: 'done',
        link: '', date: new Date(Date.now()-86400000*10).toISOString()
      },
      {
        id: uid(), title: 'Python CLI Kalkulator', type: 'Coding',
        desc: 'Kalkulator sederhana di terminal pakai Python. Fitur: operasi dasar, history, dan input validasi.',
        tech: ['Python'], status: 'done',
        link: '', date: new Date(Date.now()-86400000*20).toISOString()
      },
    ]);
  }

  if (!DB.get(KEYS.progress)) {
    DB.set(KEYS.progress, {
      gym: { current: 24, target: 90, unit: 'sesi', label: 'Gym Sessions' },
      python: { current: 8, target: 30, unit: 'hari', label: 'Python 30 Hari' },
      networking: { current: 60, target: 100, unit: '%', label: 'Materi TKJ' },
      english: { current: 15, target: 60, unit: 'hari', label: 'Belajar English' },
      roadmap: [
        { id: uid(), title: 'Selesaikan materi subnetting',   done: true,  category: 'TKJ' },
        { id: uid(), title: 'Konfigurasi MikroTik RB',        done: true,  category: 'TKJ' },
        { id: uid(), title: 'Simulasi topologi di Cisco PT',  done: true,  category: 'TKJ' },
        { id: uid(), title: 'Belajar Python dasar (30 hari)', done: false, category: 'Python' },
        { id: uid(), title: 'Buat 3 project Python',          done: false, category: 'Python' },
        { id: uid(), title: 'Belajar HTML & CSS',             done: true,  category: 'Web' },
        { id: uid(), title: 'Bikin portfolio website',        done: true,  category: 'Web' },
        { id: uid(), title: 'Belajar JavaScript dasar',       done: false, category: 'Web' },
        { id: uid(), title: 'Deploy ke GitHub Pages',         done: false, category: 'Web' },
      ]
    });
  }

  if (!DB.get(KEYS.status)) {
    DB.set(KEYS.status, { text: 'Lagi belajar Python & ngulik jaringan 🔧', updated: new Date().toISOString() });
  }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();
  updateStreak();
  initNavbar();
  initReveal();
});
