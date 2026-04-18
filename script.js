const STORAGE_KEY = 'mindgym_submissions';

const filterInfo = {
  A: {
    name: 'Filtro A — Entusiasta / Apoiador',
    desc: 'Você tende a encorajar e apoiar as pessoas ao seu redor. Sua lealdade é um ponto forte, mas às vezes pode minimizar problemas ao invés de enfrentá-los. Você cria um ambiente positivo e motivador.'
  },
  B: {
    name: 'Filtro B — Empático / Compreensivo',
    desc: 'Você é altamente sintonizado com as emoções dos outros. Sua empatia é um dom valioso, mas cuidado para não ficar preso no problema sem ajudar a encontrar soluções. Você faz as pessoas se sentirem ouvidas.'
  },
  C: {
    name: 'Filtro C — Realista / Questionador',
    desc: 'Você busca a verdade e questiona suposições. Seu pensamento crítico é valioso, mas pode parecer desafiador em momentos emocionalmente delicados. Você ajuda as pessoas a verem a realidade com mais clareza.'
  },
  D: {
    name: 'Filtro D — Solucionador / Orientado à Ação',
    desc: 'Você foca em soluções e próximos passos práticos. Sua orientação para resultados é muito útil, mas às vezes as pessoas precisam ser ouvidas antes de receber conselhos. Você é excelente em resolver problemas concretos.'
  }
};

function showTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('panel-' + tab).classList.add('active');
  btn.classList.add('active');
  if (tab === 'results') renderResults();
}

function selectOpt(radio) {
  const name = radio.name;
  document.querySelectorAll('input[name="' + name + '"]').forEach(r => {
    r.closest('.option-label').classList.remove('selected');
  });
  radio.closest('.option-label').classList.add('selected');
}

function getSubmissions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveSubmission(sub) {
  const list = getSubmissions();
  list.push(sub);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function submitQuiz(e) {
  e.preventDefault();
  const errEl = document.getElementById('form-error');
  errEl.style.display = 'none';

  const nome = document.getElementById('candidato-nome').value.trim();
  if (!nome) { 
    errEl.textContent = 'Por favor, informe seu nome.'; 
    errEl.style.display = 'block'; 
    return; 
  }

  const answers = {};
  for (let i = 1; i <= 10; i++) {
    const sel = document.querySelector('input[name="q' + i + '"]:checked');
    if (!sel) { 
      errEl.textContent = 'Por favor, responda todas as perguntas antes de enviar.'; 
      errEl.style.display = 'block'; 
      return; 
    }
    answers['q' + i] = sel.value;
  }

  const vals = Object.values(answers);
  const scoreA = vals.filter(v => v === 'A').length;
  const scoreB = vals.filter(v => v === 'B').length;
  const scoreC = vals.filter(v => v === 'C').length;
  const scoreD = vals.filter(v => v === 'D').length;
  const scores = { A: scoreA, B: scoreB, C: scoreC, D: scoreD };
  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];

  saveSubmission({ 
    name: nome, 
    scoreA, 
    scoreB, 
    scoreC, 
    scoreD, 
    dominantFilter: dominant, 
    createdAt: new Date().toISOString() 
  });

  document.getElementById('quiz-content').style.display = 'none';
  document.getElementById('quiz-success').style.display = 'block';

  document.getElementById('success-name').textContent = 'Obrigado, ' + nome + '!';
  document.getElementById('dominant-label').textContent = filterInfo[dominant].name;
  document.getElementById('filter-desc-text').textContent = filterInfo[dominant].desc;

  const scorePairs = [
    { letter: 'A', value: scoreA },
    { letter: 'B', value: scoreB },
    { letter: 'C', value: scoreC },
    { letter: 'D', value: scoreD },
  ];

  const maxVal = Math.max(...scorePairs.map(s => s.value), 1);
  const chartEl = document.getElementById('chart-bars');

  chartEl.innerHTML = scorePairs.map(({ letter, value }) => {
    const isDom = letter === dominant;
    const barH = Math.max(Math.round((value / maxVal) * 140), 6);
    return `
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:60px;">
        <span style="font-size:22px;font-weight:bold;color:${isDom ? '#d4a017' : 'rgba(255,255,255,0.6)'};font-family:Arial,sans-serif;">${value}</span>
        <div style="width:100%;display:flex;align-items:flex-end;justify-content:center;flex:1;">
          <div style="width:44px;height:${barH}px;background:${isDom ? '#d4a017' : 'rgba(255,255,255,0.22)'};border-radius:4px 4px 0 0;"></div>
        </div>
        <div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:17px;font-family:Arial,sans-serif;
          background:${isDom ? '#d4a017' : 'transparent'};
          border:2px solid ${isDom ? '#d4a017' : 'rgba(255,255,255,0.35)'};
          color:${isDom ? '#1a1a1a' : '#fff'};">
          ${letter}
        </div>
      </div>`;
  }).join('');
}

function goToResults() {
  document.querySelectorAll('.tab-btn').forEach((b, i) => b.classList.toggle('active', i === 1));
  document.querySelectorAll('.panel').forEach((p, i) => p.classList.toggle('active', i === 1));
  renderResults();
}

function renderResults() {
  const list = getSubmissions();
  const countEl = document.getElementById('results-count');
  const listEl = document.getElementById('results-list');

  countEl.textContent = list.length + ' resposta' + (list.length !== 1 ? 's' : '') + ' enviada' + (list.length !== 1 ? 's' : '');

  if (list.length === 0) {
    listEl.innerHTML = '<div class="empty-results"><p>Nenhum resultado ainda</p><p>Seja o primeiro a preencher o questionário!</p></div>';
    return;
  }

  listEl.innerHTML = list.map((sub, idx) => {
    const f = sub.dominantFilter;
    const info = filterInfo[f];
    const scores = [
      { letter: 'A', score: sub.scoreA },
      { letter: 'B', score: sub.scoreB },
      { letter: 'C', score: sub.scoreC },
      { letter: 'D', score: sub.scoreD },
    ];
    const maxScore = Math.max(...scores.map(s => s.score));
    const date = new Date(sub.createdAt).toLocaleString('pt-BR', {
      day:'2-digit',
      month:'2-digit',
      year:'numeric',
      hour:'2-digit',
      minute:'2-digit'
    });

    const barsHtml = scores.map(({ letter, score }) => {
      const isDom = score === maxScore && letter === f;
      const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      return `
        <div class="score-col">
          <div class="score-label${isDom ? ' dominant' : ''}">${letter}</div>
          <div class="score-bar-track">
            <div class="score-bar-fill${isDom ? ' dominant' : ''}" style="width:${pct}%"></div>
          </div>
          <div class="score-value${isDom ? ' dominant' : ''}">${score}</div>
        </div>`;
    }).join('');

    return `
      <div class="result-card">
        <div class="result-header">
          <div class="result-num">${idx + 1}</div>
          <div class="result-name">${sub.name}</div>
          <div class="filter-badge badge-${f}">${f}</div>
          <div class="result-date">${date}</div>
        </div>
        <div class="result-body">
          <div class="filter-box filter-box-${f}">
            <div class="filter-box-name">${info ? info.name : 'Filtro ' + f}</div>
            <div class="filter-box-desc">${info ? info.desc : ''}</div>
          </div>
          <div class="scores-grid">${barsHtml}</div>
        </div>
      </div>`;
  }).reverse().join('');
}
