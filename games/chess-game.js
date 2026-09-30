import { Chess } from '../vendor/chess.js';
import { StockfishClient } from './stockfish-client.js';
import { $, t, copy, icon, icons, download } from './ui.js';

const shapes = {
  p: '<circle cx="32" cy="17" r="8"/><path d="M25 28h14l-3 13 10 10H18l10-10z"/><path d="M17 53h30v5H17z"/>',
  r: '<path d="M16 9h8v9h5V9h6v9h5V9h8v17l-7 5 2 18H21l2-18-7-5zM16 52h32v6H16z"/>',
  n: '<path d="M18 48c1-14 8-15 18-23L25 30l-9-5 10-14 6-2 2-6 8 8c12 9 9 25 4 37zM16 52h34v6H16z"/><circle cx="34" cy="18" r="2" fill="currentColor"/>',
  b: '<path d="M32 5C10 23 18 31 27 33l-6 15h22l-6-15C48 28 52 20 32 5zM16 52h32v6H16z"/><path d="m28 14 9 10" fill="none"/>',
  q: '<path d="m13 17 11 11 8-15 8 15 11-11-8 29H21zM17 50h30v8H17z"/><circle cx="12" cy="13" r="4"/><circle cx="32" cy="9" r="4"/><circle cx="52" cy="13" r="4"/>',
  k: '<path d="M29 4h6v6h6v6h-6v7h-6v-7h-6v-6h6zM32 26c-18-16-24 6-10 17l-2 6h24l-2-6c14-11 8-33-10-17zM16 52h32v6H16z"/>'
};
export function pieceSVG(type, color) {
  return `<svg class="chess-piece ${color}" viewBox="0 0 64 64" aria-hidden="true" fill="${color === 'w' ? '#fffdf1' : '#182b35'}" stroke="${color === 'w' ? '#1d3540' : '#d0edf0'}" stroke-width="2.1" stroke-linejoin="round">${shapes[type]}</svg>`;
}
const names = { p: ['بيدق', 'pawn'], r: ['قلعة', 'rook'], n: ['حصان', 'knight'], b: ['فيل', 'bishop'], q: ['وزير', 'queen'], k: ['ملك', 'king'] };
export function mount(root) {
  let game = new Chess();
  const engine = new StockfishClient();
  let human = 'w', orientation = 'w', selected = null, hint = null, busy = false, started = false, generation = 0, error = false;
  let analysis = { depth: null, nodes: null, score: null, mate: false, pv: [] };
  root.innerHTML = `<div class="game-workspace chess-workspace">
    <div class="chess-stage"><div class="player-strip"><span class="player-avatar">${icon('cpu')}</span><span><b>STOCKFISH 19</b><small>WASM / LITE NNUE</small></span><span class="engine-state" data-engine-state></span></div>
      <div class="chess-board" role="grid" aria-label="Chess board" data-chess-board></div>
      <div class="player-strip"><span class="player-avatar human">${icon('user-round')}</span><span>${copy('أنت','YOU','b')}<small data-human-side></small></span><span class="game-toolbar">
        <button class="icon-button" data-chess-undo title="Undo your last turn" aria-label="Undo your last turn">${icon('undo-2')}</button>
        <button class="icon-button" data-chess-hint title="Suggest a move" aria-label="Suggest a move">${icon('lightbulb')}</button>
        <button class="icon-button" data-chess-flip title="Flip board" aria-label="Flip board">${icon('flip-vertical-2')}</button>
        <button class="icon-button" data-chess-export title="Download PGN" aria-label="Download PGN">${icon('download')}</button>
      </span></div>
    </div>
    <aside class="game-console"><div class="console-heading"><span>ENGINE ROOM</span><i></i></div>
      <h3 data-chess-status role="status" aria-live="polite"></h3>
      <div class="game-settings"><label>${copy('مستوى البحث','Search level')}<select data-chess-level><option value="explore" data-ar="استكشاف" data-en="Explore">${t('استكشاف','Explore')}</option><option value="challenge" selected data-ar="تحدّي" data-en="Challenge">${t('تحدّي','Challenge')}</option><option value="research" data-ar="بحث عميق" data-en="Deep search">${t('بحث عميق','Deep search')}</option></select></label>
      <label>${copy('لونك في المباراة القادمة','Your side next game')}<select data-chess-side><option value="w" data-ar="الأبيض" data-en="White">${t('الأبيض','White')}</option><option value="b" data-ar="الأسود" data-en="Black">${t('الأسود','Black')}</option></select></label></div>
      <button class="button primary-action" data-chess-new>${icon('play')}<span data-start-label></span></button>
      <div class="engine-metrics"><div>${copy('عمق البحث','SEARCH DEPTH','span')}<strong data-depth>--</strong></div><div>${copy('مواقع فُحصت','NODES SEARCHED','span')}<strong data-nodes>--</strong></div><div>${copy('تقييم الأبيض','WHITE EVALUATION','span')}<strong data-evaluation>--</strong></div></div>
      <div class="evaluation-track" aria-hidden="true"><span data-eval-bar></span></div>
      <div class="move-list-head">${copy('سجل النقلات','MOVE HISTORY')}<span>PGN</span></div><ol class="chess-history" data-chess-history></ol>
      <p class="engine-disclosure">${copy('Stockfish 19 Lite محرك شطرنج محلي بحدود زمنية. ليس نموذج محادثة أو تقييم Elo معتمدًا.','Stockfish 19 Lite is a local chess engine with time limits, not a conversational model or a certified Elo rating.')}</p>
      <a class="engine-source" href="vendor/stockfish/corresponding-source.zip">GPL-3.0 / ${t('المصدر','SOURCE')} ↗</a>
    </aside></div>
    <dialog class="promotion-dialog" data-promotion><h3>${copy('ترقية البيدق','Promote pawn')}</h3><div data-promotion-options></div><button class="icon-button" data-promotion-cancel title="Cancel" aria-label="Cancel">${icon('x')}</button></dialog>`;
  const board = $(root, '[data-chess-board]');
  const status = $(root, '[data-chess-status]');
  const promo = $(root, '[data-promotion]');
  let pendingPromotion = null;
  function boardRender() {
    const focusSquare = document.activeElement?.dataset?.square;
    const files = orientation === 'w' ? 'abcdefgh' : 'hgfedcba';
    const ranks = orientation === 'w' ? [8,7,6,5,4,3,2,1] : [1,2,3,4,5,6,7,8];
    const legal = selected ? game.moves({ square: selected, verbose: true }).map(m => m.to) : [];
    const last = game.history({ verbose: true }).at(-1);
    board.innerHTML = ranks.flatMap((rank, row) => [...files].map((file, col) => {
      const square = `${file}${rank}`, piece = game.get(square);
      const dark = (file.charCodeAt(0) - 97 + rank) % 2 === 0;
      const classes = ['chess-square', dark ? 'dark' : 'light', selected === square ? 'selected' : '', legal.includes(square) ? 'legal' : '', last && [last.from,last.to].includes(square) ? 'last-move' : '', hint && [hint.slice(0,2),hint.slice(2,4)].includes(square) ? 'hint' : '', game.isCheck() && piece?.type === 'k' && piece.color === game.turn() ? 'in-check' : ''].filter(Boolean).join(' ');
      const label = piece ? `${square} ${t(piece.color === 'w' ? 'أبيض' : 'أسود', piece.color === 'w' ? 'white' : 'black')} ${t(...names[piece.type])}` : square;
      return `<button type="button" class="${classes}" role="gridcell" data-square="${square}" aria-label="${label}" aria-selected="${selected === square}" tabindex="${square === (focusSquare || 'e2') ? 0 : -1}" draggable="${!!piece && piece.color === human && !busy}">${piece ? pieceSVG(piece.type,piece.color) : ''}${col === 0 ? `<small class="rank-label">${rank}</small>` : ''}${row === 7 ? `<small class="file-label">${file}</small>` : ''}</button>`;
    })).join('');
    if (focusSquare) $(board, `[data-square="${focusSquare}"]`)?.focus({ preventScroll: true });
  }
  function render() {
    boardRender();
    status.textContent = error ? t('تعذّر تشغيل المحرك. أعد بدء المباراة.','Engine unavailable. Start a new game to retry.') : !started ? t('هل تقبل التحدّي؟','Your move against the machine.') : game.isCheckmate() ? (game.turn() === human ? t('كش مات. فاز المحرك.','Checkmate. Engine wins.') : t('كش مات. أنت الفائز!','Checkmate. You win!')) : game.isDraw() ? t('انتهت المباراة بالتعادل.','The game is drawn.') : busy ? t('المحرك يبحث…','Engine searching…') : game.isCheck() ? t('كش! دورك.','Check! Your turn.') : t('دورك الآن.','Your move.');
    $(root,'[data-engine-state]').textContent = busy ? 'SEARCHING' : started ? 'READY' : 'ON DEMAND';
    $(root,'[data-start-label]').textContent = started ? t('مباراة جديدة','New game') : t('ابدأ المباراة','Start game');
    $(root,'[data-human-side]').textContent = human === 'w' ? 'WHITE' : 'BLACK';
    $(root,'[data-chess-undo]').disabled = game.history().length < (human === 'w' ? 1 : 2);
    $(root,'[data-chess-hint]').disabled = !started || busy || game.isGameOver() || game.turn() !== human;
    $(root,'[data-chess-export]').disabled = !game.history().length;
    metricsRender();
    const moves = game.history();
    $(root,'[data-chess-history]').innerHTML = moves.length ? moves.reduce((rows,move,i) => { if (!(i % 2)) rows.push(`<li><span>${i/2+1}.</span><b>${move}</b><b>${moves[i+1] || ''}</b></li>`); return rows; },[]).join('') : `<li class="history-empty">${t('لا نقلات بعد.','No moves yet.')}</li>`;
  }
  function metricsRender() {
    $(root,'[data-depth]').textContent = analysis.depth ?? '--';
    $(root,'[data-nodes]').textContent = analysis.nodes == null ? '--' : analysis.nodes.toLocaleString('en-US');
    $(root,'[data-evaluation]').textContent = analysis.score == null ? '--' : analysis.mate ? `M${analysis.score}` : `${analysis.score >= 0 ? '+' : ''}${(analysis.score/100).toFixed(2)}`;
    $(root,'[data-eval-bar]').style.width = `${analysis.score == null ? 50 : analysis.mate ? analysis.score > 0 ? 100 : 0 : 50 + Math.max(-45,Math.min(45,analysis.score/12))}%`;
  }
  async function search(isHint = false) {
    const token = generation; busy = true; error = false; render();
    try {
      const move = await engine.search(game.fen(), $(root,'[data-chess-level]').value, info => {
        if (token !== generation) return;
        for (const key of ['depth','nodes','score']) if (info[key] != null) analysis[key] = info[key];
        if (info.score != null) analysis.mate = info.mate;
        metricsRender();
      });
      if (token !== generation) return;
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(move)) throw new Error('Invalid engine move');
      if (isHint) hint = move;
      else game.move({ from: move.slice(0,2), to: move.slice(2,4), promotion: move[4] });
    } catch { if (token === generation) error = true; }
    finally { if (token === generation) { busy = false; render(); } }
  }
  async function start() {
    generation++; engine.cancel(); promo.close(); pendingPromotion = null;
    human = $(root,'[data-chess-side]').value; orientation = human;
    game = new Chess(); selected = null; hint = null; started = true; error = false;
    analysis = { depth:null,nodes:null,score:null,mate:false,pv:[] };
    const token = generation; busy = true; render();
    try { await engine.boot(); if (token !== generation) return; busy = false; render(); if (human === 'b') search(); }
    catch { if (token === generation) { error = true; busy = false; render(); } }
  }
  function play(from,to,promotion) {
    try { game.move({ from,to,promotion }); } catch { return; }
    selected = null; hint = null; analysis = { depth:null,nodes:null,score:null,mate:false,pv:[] }; render();
    if (!game.isGameOver()) search();
  }
  function choose(square) {
    if (!started || busy || error || game.isGameOver() || game.turn() !== human) return;
    const piece = game.get(square);
    if (selected && square !== selected) {
      const candidates = game.moves({ square:selected, verbose:true }).filter(m => m.to === square);
      if (candidates.length) {
        if (candidates.some(m => m.promotion)) {
          pendingPromotion = { from:selected,to:square };
          $(root,'[data-promotion-options]').innerHTML = ['q','r','b','n'].map(p => `<button data-promote="${p}" aria-label="${t(...names[p])}">${pieceSVG(p,human)}</button>`).join(''); promo.showModal();
        } else play(selected,square);
        return;
      }
    }
    selected = piece?.color === human && selected !== square ? square : null; hint = null; boardRender();
  }
  board.addEventListener('click', e => { const square = e.target.closest('[data-square]'); if (square) choose(square.dataset.square); });
  board.addEventListener('keydown', e => {
    const offset = { ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8 }[e.key];
    if (!offset) return; e.preventDefault();
    const squares = [...board.children], index = squares.indexOf(e.target.closest('[data-square]'));
    const next = Math.max(0,Math.min(63,index+offset)); squares.forEach((s,i)=>s.tabIndex = i === next ? 0 : -1); squares[next].focus();
  });
  board.addEventListener('dragstart', e => { const square = e.target.closest('[data-square]'); if (!square || busy) return e.preventDefault(); e.dataTransfer.setData('text/plain',square.dataset.square); });
  board.addEventListener('dragover', e => e.preventDefault());
  board.addEventListener('drop', e => { e.preventDefault(); const from = e.dataTransfer.getData('text/plain'), target = e.target.closest('[data-square]'); if (/^[a-h][1-8]$/.test(from) && target && game.get(from)?.color === human) { selected = from; choose(target.dataset.square); } });
  $(root,'[data-chess-new]').onclick = start;
  $(root,'[data-chess-hint]').onclick = () => search(true);
  $(root,'[data-chess-flip]').onclick = () => { orientation = orientation === 'w' ? 'b' : 'w'; boardRender(); };
  $(root,'[data-chess-undo]').onclick = () => {
    generation++; engine.cancel(); busy = false; error = false; game.undo(); if (game.turn() !== human) game.undo(); selected = null; hint = null;
    analysis = { depth:null,nodes:null,score:null,mate:false,pv:[] }; render();
  };
  $(root,'[data-chess-export]').onclick = () => download(game.pgn(),'aifrahat-chess.pgn','application/x-chess-pgn');
  $(root,'[data-promotion-options]').onclick = e => { const p = e.target.closest('[data-promote]'); if (p && pendingPromotion) { const m=pendingPromotion; pendingPromotion=null; promo.close(); play(m.from,m.to,p.dataset.promote); } };
  $(root,'[data-promotion-cancel]').onclick = () => { pendingPromotion=null; promo.close(); };
  promo.addEventListener('cancel',()=>{pendingPromotion=null;});
  render(); icons();
  return { render };
}
