const data = window.TASK_DATA || [];
const root = document.getElementById('tasksRoot');
const stats = document.getElementById('stats');
const searchInput = document.getElementById('searchInput');
const blockFilter = document.getElementById('blockFilter');
const levelFilter = document.getElementById('levelFilter');
const resetBtn = document.getElementById('resetBtn');
const levels = ['Базовый','Средний','Повышенный'];

const matchTables = {
  '2-10': {
    leftTitle: 'Verb',
    rightTitle: 'Noun',
    left: ['make', 'take', 'reach', 'pay'],
    right: ['progress', 'responsibility', 'agreement', 'attention']
  },
  '2-20': {
    leftTitle: 'Verb',
    rightTitle: 'Noun',
    left: ['cause', 'keep', 'face', 'meet'],
    right: ['trouble', 'promise', 'challenge', 'deadline']
  },
  '2-32': {
    leftTitle: 'Verb',
    rightTitle: 'Noun',
    left: ['pose', 'draw', 'incur', 'adopt'],
    right: ['risk', 'lesson', 'loss', 'measure']
  }
};

function renderMatchTable(blockId, taskNumber) {
  const table = matchTables[`${blockId}-${taskNumber}`];
  if (!table) return '';
  const rows = table.left.map((leftItem, index) => `
    <tr>
      <td>${escapeHtml(leftItem)}</td>
      <td>${escapeHtml(table.right[index] || '')}</td>
    </tr>`).join('');
  return `
    <div class="match-table-wrap">
      <table class="match-table">
        <thead>
          <tr>
            <th>${escapeHtml(table.leftTitle)}</th>
            <th>${escapeHtml(table.rightTitle)}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}


function levelClass(level) {
  if (level === 'Базовый') return 'easy';
  if (level === 'Средний') return 'medium';
  return 'hard';
}

function fillFilters() {
  data.forEach(block => {
    const option = document.createElement('option');
    option.value = String(block.id);
    option.textContent = `Блок ${block.id}. ${block.title}`;
    blockFilter.appendChild(option);
  });
}

function taskMatches(task, block) {
  const q = searchInput.value.trim().toLowerCase();
  const blockOk = blockFilter.value === 'all' || String(block.id) === blockFilter.value;
  const levelOk = levelFilter.value === 'all' || task.level === levelFilter.value;
  const textOk = !q || (`${block.title} ${task.body}`).toLowerCase().includes(q);
  return blockOk && levelOk && textOk;
}

function renderStats(visibleTasks) {
  const total = visibleTasks.length;
  const byLevel = Object.fromEntries(levels.map(l => [l, visibleTasks.filter(t => t.level === l).length]));
  stats.innerHTML = `
    <div class="stat"><span>Всего заданий</span><strong>${total}</strong></div>
    <div class="stat"><span>Базовый / Средний</span><strong>${byLevel['Базовый']} / ${byLevel['Средний']}</strong></div>
    <div class="stat"><span>Повышенный</span><strong>${byLevel['Повышенный']}</strong></div>
  `;
}

function escapeHtml(text) {
  return text.replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
}

function render() {
  root.innerHTML = '';
  const visibleTasks = [];
  data.forEach(block => block.exercises.forEach(task => { if (taskMatches(task, block)) visibleTasks.push(task); }));
  renderStats(visibleTasks);

  const visibleBlocks = data.filter(block => block.exercises.some(task => taskMatches(task, block)));
  if (!visibleBlocks.length) {
    root.innerHTML = '<div class="empty">Ничего не найдено. Попробуйте изменить поиск или фильтры.</div>';
    return;
  }

  visibleBlocks.forEach(block => {
    const blockEl = document.createElement('article');
    blockEl.className = 'block';
    blockEl.innerHTML = `
      <div class="block-title">
        <div>
          <h2>Блок ${block.id}. ${block.title}</h2>
          <p class="block-description">${block.description || ''}</p>
        </div>
      </div>`;

    let displayNumber = 1;

    levels.forEach(level => {
      const tasks = block.exercises
        .filter(task => task.level === level && taskMatches(task, block))
        .sort((a, b) => a.number - b.number);
      if (!tasks.length) return;

      const section = document.createElement('section');
      section.className = 'level';
      section.innerHTML = `<h3>${level} <span class="level-count">${tasks.length} заданий</span></h3><div class="cards"></div>`;
      const cards = section.querySelector('.cards');

      tasks.forEach(task => {
        const currentNumber = displayNumber++;
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <div class="card-header">
            <div class="card-title-wrap">
              <strong class="card-title">Упражнение ${currentNumber}</strong>
            </div>
            <span class="badge ${levelClass(task.level)}">${task.level}</span>
          </div>
          <div class="task-text">${escapeHtml(task.body)}${renderMatchTable(block.id, task.number)}</div>`;
        cards.appendChild(card);
      });

      blockEl.appendChild(section);
    });

    root.appendChild(blockEl);
  });
}

fillFilters();
[searchInput, blockFilter, levelFilter].forEach(el => el.addEventListener('input', render));
resetBtn.addEventListener('click', () => {
  searchInput.value = '';
  blockFilter.value = 'all';
  levelFilter.value = 'all';
  render();
});
render();
