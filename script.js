const screens = {
  home: document.getElementById('homeScreen'),
  test: document.getElementById('testScreen'),
  review: document.getElementById('reviewScreen')
};

const startBtn = document.getElementById('startBtn');
const backHomeBtn = document.getElementById('backHomeBtn');
const foundBugBtn = document.getElementById('foundBugBtn');
const finishBtn = document.getElementById('finishBtn');
const againBtn = document.getElementById('againBtn');

const theoryDialog = document.getElementById('theoryDialog');
const openTheoryBtn = document.getElementById('openTheoryBtn');
const closeTheoryBtn = document.getElementById('closeTheoryBtn');
const dialog = document.getElementById('reportDialog');
const closeDialogBtn = document.getElementById('closeDialogBtn');
const reportForm = document.getElementById('reportForm');

const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const emailHint = document.getElementById('emailHint');
const passwordHint = document.getElementById('passwordHint');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');

const timerEl = document.getElementById('timer');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');

const titleField = document.getElementById('titleField');
const stepsField = document.getElementById('stepsField');
const expectedField = document.getElementById('expectedField');
const actualField = document.getElementById('actualField');
const severityField = document.getElementById('severityField');
const priorityField = document.getElementById('priorityField');

const scoreText = document.getElementById('scoreText');
const userBugTitle = document.getElementById('userBugTitle');
const userBugSummary = document.getElementById('userBugSummary');
const foundList = document.getElementById('foundList');
const missedList = document.getElementById('missedList');
const reportFeedback = document.getElementById('reportFeedback');

let timerId = null;
let startedAt = null;
let reportsCount = Number(localStorage.getItem('qaReportsCount') || 0);

const bugBank = [
  {
    id: 'empty-password-login',
    label: 'Login button accepts empty password',
    keywords: ['password', 'пароль', 'пуст', 'empty', 'blank', 'login', 'кноп', 'button', 'disabled', 'неактив', 'validation', 'валидац'],
    goodSeverity: ['Major', 'Critical'],
    goodPriority: ['High', 'Medium']
  },
  {
    id: 'invalid-email-validation',
    label: 'Invalid email format is not blocked',
    keywords: ['email', 'почт', 'невалид', 'invalid', 'format', 'формат', 'validation', 'валидац', 'error', 'ошиб'],
    goodSeverity: ['Major'],
    goodPriority: ['High', 'Medium']
  },
  {
    id: 'loader-stuck',
    label: 'Loader/state does not recover after failed login',
    keywords: ['loader', 'загруз', 'loading', 'stuck', 'завис', 'disabled', 'state', 'состоя', 'recover'],
    goodSeverity: ['Major'],
    goodPriority: ['High']
  }
];

function showScreen(name){
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

function updateProgress(){
  progressText.textContent = `${reportsCount} reports`;
  progressBar.style.width = `${Math.min(100, reportsCount * 18)}%`;
}

function resetSession(){
  emailInput.value = '';
  passwordInput.value = '';
  emailHint.textContent = '';
  passwordHint.textContent = '';
  loginMessage.textContent = '';
  loginBtn.textContent = 'Log In';
  loginBtn.classList.remove('loading');
  [titleField, stepsField, expectedField, actualField].forEach(el => el.value = '');
  severityField.value = '';
  priorityField.value = '';
}

function startTimer(){
  clearInterval(timerId);
  startedAt = Date.now();
  timerId = setInterval(() => {
    const s = Math.floor((Date.now() - startedAt) / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    timerEl.textContent = `${mm}:${ss}`;
  }, 300);
}

function stopTimer(){
  clearInterval(timerId);
}

function validateLoginFields(){
  const email = emailInput.value.trim();
  const pass = passwordInput.value.trim();

  // Специально "сломанное" поведение тренажера:
  // email почти не валидируется, password может быть пустым, кнопка всё равно активна.
  emailHint.textContent = email && !email.includes('@') ? '' : '';
  passwordHint.textContent = '';
}

emailInput.addEventListener('input', validateLoginFields);
passwordInput.addEventListener('input', validateLoginFields);

loginBtn.addEventListener('click', () => {
  loginBtn.classList.add('loading');
  loginBtn.textContent = 'Loading...';
  loginMessage.textContent = '';

  setTimeout(() => {
    // Еще один баг: после неудачной попытки состояние странно возвращается не всегда логично.
    loginBtn.classList.remove('loading');
    loginBtn.textContent = 'Log In';
    if (!emailInput.value.trim() || !passwordInput.value.trim()) {
      loginMessage.textContent = 'Server error. Try again later.';
    } else if (!emailInput.value.includes('@')) {
      loginMessage.textContent = 'Wrong credentials.';
    } else {
      loginMessage.textContent = 'Wrong credentials.';
    }
  }, 900);
});

startBtn.addEventListener('click', () => {
  resetSession();
  showScreen('test');
  startTimer();
});

backHomeBtn.addEventListener('click', () => {
  stopTimer();
  showScreen('home');
});

foundBugBtn.addEventListener('click', () => {
  dialog.showModal();
});

closeDialogBtn.addEventListener('click', () => dialog.close());

openTheoryBtn.addEventListener('click', () => theoryDialog.showModal());
closeTheoryBtn.addEventListener('click', () => theoryDialog.close());

function li(text){
  const item = document.createElement('li');
  item.textContent = text;
  return item;
}

function normalize(str){
  return (str || '').toLowerCase();
}

function scoreReport(reportText, severity, priority){
  const found = [];
  const missed = [];

  bugBank.forEach(bug => {
    const matches = bug.keywords.filter(k => reportText.includes(k)).length;
    if (matches >= 2) found.push(bug);
    else missed.push(bug);
  });

  let score = found.length * 22;

  const hasSteps = stepsField.value.split('\n').filter(x => x.trim()).length >= 2 || stepsField.value.length > 35;
  const hasExpected = expectedField.value.trim().length > 12;
  const hasActual = actualField.value.trim().length > 12;
  const hasTitle = titleField.value.trim().length > 8;

  if (hasTitle) score += 8;
  if (hasSteps) score += 10;
  if (hasExpected) score += 8;
  if (hasActual) score += 8;
  if (severity) score += 4;
  if (priority) score += 4;

  return { found, missed, score: Math.min(100, score), hasSteps, hasExpected, hasActual, hasTitle };
}

reportForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const allText = normalize([
    titleField.value,
    stepsField.value,
    expectedField.value,
    actualField.value,
    severityField.value,
    priorityField.value
  ].join(' '));

  const result = scoreReport(allText, severityField.value, priorityField.value);

  foundList.innerHTML = '';
  missedList.innerHTML = '';

  result.found.forEach(b => foundList.appendChild(li(b.label)));
  result.missed.forEach(b => missedList.appendChild(li(b.label)));

  if (!result.found.length) foundList.appendChild(li('Пока не распознано. Попробуй описывать баг конкретнее.'));
  if (!result.missed.length) missedList.appendChild(li('Нормально, основные проблемы ты зацепил.'));

  scoreText.textContent = `${result.score}%`;
  userBugTitle.textContent = titleField.value.trim() || 'Без title';
  userBugSummary.textContent = actualField.value.trim() || 'Actual result не заполнен';

  const feedback = [];
  if (!result.hasTitle) feedback.push('Title слишком пустой/общий.');
  if (!result.hasSteps) feedback.push('Steps должны быть пошаговыми, чтобы другой человек мог повторить баг.');
  if (!result.hasExpected) feedback.push('Expected result нужен конкретный, а не “должно работать”.');
  if (!result.hasActual) feedback.push('Actual result должен описывать фактическое поведение.');
  if (!severityField.value) feedback.push('Severity не выбрана.');
  if (!priorityField.value) feedback.push('Priority не выбран.');
  if (!feedback.length) feedback.push('Баг-репорт оформлен нормально для MVP. Дальше можно улучшать точность формулировок.');

  reportFeedback.textContent = feedback.join(' ');

  reportsCount += 1;
  localStorage.setItem('qaReportsCount', String(reportsCount));
  updateProgress();

  dialog.close();
  stopTimer();
  showScreen('review');
});

finishBtn.addEventListener('click', () => showScreen('home'));

againBtn.addEventListener('click', () => {
  resetSession();
  showScreen('test');
  startTimer();
});

updateProgress();
