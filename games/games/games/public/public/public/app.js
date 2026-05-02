const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

const initData = tg.initData;
const headers = { 
  'Content-Type': 'application/json',
  'X-Telegram-Init-Data': initData
};

let balance = 0;

async function loadMe() {
  const res = await fetch('/api/me', { headers });
  const data = await res.json();
  balance = data.balance;
  document.getElementById('balance').textContent = balance;
}

// Переключение вкладок
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.game').forEach(g => g.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Бонус
document.getElementById('bonusBtn').addEventListener('click', async () => {
  const res = await fetch('/api/bonus', { method: 'POST', headers });
  const data = await res.json();
  if (data.success) {
    alert(`🎁 Вы получили ${data.amount} монет!`);
    loadMe();
  } else {
    alert(data.message || 'Бонус недоступен');
  }
});

// СЛОТ
document.getElementById('slotSpin').addEventListener('click', async () => {
  const bet = parseInt(document.getElementById('slotBet').value);
  if (bet > balance) return alert('Недостаточно монет');
  
  const reels = [document.getElementById('reel1'), document.getElementById('reel2'), document.getElementById('reel3')];
  reels.forEach(r => r.classList.add('spinning'));
  document.getElementById('slotResult').textContent = '';
  
  const res = await fetch('/api/slot/spin', {
    method: 'POST', headers,
    body: JSON.stringify({ bet })
  });
  const data = await res.json();
  
  setTimeout(() => {
    reels.forEach((r, i) => {
      r.classList.remove('spinning');
      r.textContent = data.reels[i];
    });
    balance = data.balance;
    document.getElementById('balance').textContent = balance;
    if (data.win > 0) {
      document.getElementById('slotResult').textContent = `🎉 Выигрыш: ${data.win}!`;
      tg.HapticFeedback.notificationOccurred('success');
    } else {
      document.getElementById('slotResult').textContent = '😢 Не повезло';
    }
  }, 1000);
});

// РУЛЕТКА
async function playRoulette(betType, betValue = null) {
  const bet = parseInt(document.getElementById('rouletteBet').value);
  if (bet > balance) return alert('Недостаточно монет');
  
  const res = await fetch('/api/roulette/spin', {
    method: 'POST', headers,
    body: JSON.stringify({ bet, betType, betValue })
  });
  const data = await res.json();
  
  const numEl = document.getElementById('rouletteNum');
  numEl.textContent = data.number;
  numEl.className = 'roulette-number ' + data.color;
  balance = data.balance;
  document.getElementById('balance').textContent = balance;
  document.getElementById('rouletteResult').textContent = 
    data.win > 0 ? `🎉 Выигрыш: ${data.win}!` : '😢 Не повезло';
}

document.querySelectorAll('#roulette .bet-btn[data-type]').forEach(btn => {
  btn.addEventListener('click', () => playRoulette(btn.dataset.type));
});

document.getElementById('rouletteNumBtn').addEventListener('click', () => {
  const num = document.getElementById('rouletteNumber').value;
  if (num === '' || num < 0 || num > 36) return alert('Введите число 0-36');
  playRoulette('number', num);
});

// КУБИКИ
function updateMultiplier() {
  const target = parseInt(document.getElementById('diceTarget').value);
  const overMulti = (98 / (100 - target)).toFixed(2);
  const underMulti = (98 / (target - 1)).toFixed(2);
  document.getElementById('diceMultiplier').textContent = 
    `⬇ ×${underMulti} | ⬆ ×${overMulti}`;
}

document.getElementById('diceTarget').addEventListener('input', updateMultiplier);
updateMultiplier();

async function playDice(type) {
  const bet = parseInt(document.getElementById('diceBet').value);
  const target = parseInt(document.getElementById('diceTarget').value);
  if (bet > balance) return alert('Недостаточно монет');
  
  const res = await fetch('/api/dice/roll', {
    method: 'POST', headers,
    body: JSON.stringify({ bet, type, target })
  });
  const data = await res.json();
  
  document.getElementById('diceRoll').textContent = data.roll;
  balance = data.balance;
  document.getElementById('balance').textContent = balance;
  document.getElementById('diceResult').textContent = 
    data.win > 0 ? `🎉 Выигрыш: ${data.win}!` : '😢 Не повезло';
}

document.getElementById('diceOver').addEventListener('click', () => playDice('over'));
document.getElementById('diceUnder').addEventListener('click', () => playDice('under'));

loadMe();
