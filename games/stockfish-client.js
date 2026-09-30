export const LEVELS = Object.freeze({ explore: { skill: 1, depth: 7, time: 350 }, challenge: { skill: 10, depth: 13, time: 900 }, research: { skill: 20, depth: 20, time: 1800 } });
export function parseInfo(line, turn = 'w') {
  const depth = line.match(/\bdepth (\d+)/);
  const nodes = line.match(/\bnodes (\d+)/);
  const score = line.match(/\bscore (cp|mate) (-?\d+)/);
  const pv = line.match(/\bpv (.+)$/);
  return { depth: depth ? Number(depth[1]) : null, nodes: nodes ? Number(nodes[1]) : null, score: score ? Number(score[2]) * (turn === 'w' ? 1 : -1) : null, mate: score?.[1] === 'mate', pv: pv?.[1].split(' ').slice(0, 8) || [] };
}
export class StockfishClient {
  worker = null;
  ready = null;
  pending = null;
  async boot() {
    if (this.ready) return this.ready;
    this.ready = new Promise((resolve, reject) => {
      const worker = new Worker(new URL('../vendor/stockfish/stockfish-19-lite-single.js', import.meta.url));
      this.worker = worker;
      this.bootReject = reject;
      this.bootTimer = setTimeout(() => this.fail(new Error('Engine initialization timed out')), 25000);
      worker.onerror = () => this.fail(new Error('Stockfish could not start'));
      worker.onmessage = event => {
        if (this.worker !== worker) return;
        const line = String(event.data);
        if (line === 'uciok') { worker.postMessage('setoption name Hash value 32'); worker.postMessage('isready'); }
        else if (line === 'readyok') { clearTimeout(this.bootTimer); this.bootReject = null; resolve(); }
        else if (line.startsWith('info ') && this.pending) this.pending.onInfo?.(parseInfo(line, this.pending.turn));
        else if (line.startsWith('bestmove ') && this.pending) { const request = this.pending; this.pending = null; clearTimeout(request.timer); request.resolve(line.split(' ')[1]); }
      };
      worker.postMessage('uci');
    });
    return this.ready;
  }
  async search(fen, level = 'challenge', onInfo) {
    await this.boot();
    if (this.pending) throw new Error('Engine search already active');
    const settings = LEVELS[level] || LEVELS.challenge;
    return new Promise((resolve, reject) => {
      this.pending = { resolve, reject, onInfo, turn: fen.split(' ')[1], timer: setTimeout(() => this.fail(new Error('Engine search timed out')), 15000) };
      this.worker.postMessage(`setoption name Skill Level value ${settings.skill}`);
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${settings.depth} movetime ${settings.time}`);
    });
  }
  fail(error) { this.cancel(error); }
  cancel(error = new Error('Search cancelled')) {
    clearTimeout(this.bootTimer); this.bootReject?.(error); this.bootReject = null;
    if (this.pending) { clearTimeout(this.pending.timer); this.pending.reject(error); this.pending = null; }
    this.worker?.terminate(); this.worker = null; this.ready = null;
  }
}
