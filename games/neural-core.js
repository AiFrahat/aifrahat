export const CHOICES = ['rock','paper','scissors'];
export function features(history) {
  const recent = history.slice(-4);
  return Array.from({length:4},(_,i)=>Array.from({length:3},(_,j)=>recent[i] === j ? 1 : 0)).flat();
}
export function outcome(human, computer) {
  if (![0,1,2].includes(human) || ![0,1,2].includes(computer)) throw new Error('Invalid move');
  return human === computer ? 0 : (human - computer + 3) % 3 === 1 ? 1 : -1;
}
export class NeuralOpponent {
  constructor(neataptic, random = Math.random) { this.neataptic=neataptic; this.random=random; this.reset(); }
  reset() {
    this.network = new this.neataptic.architect.Perceptron(12,16,3);
    this.history=[]; this.samples=[]; this.rounds=[]; this.correct=0; this.evaluated=0;
    this.next=this.plan();
  }
  plan() {
    const raw = this.history.length >= 4 ? this.network.activate(features(this.history)) : [1,1,1];
    const sum = raw.reduce((a,b)=>a+b,0) || 1;
    const scores = raw.map(n=>n/sum);
    const predicted = this.samples.length >= 3 ? scores.indexOf(Math.max(...scores)) : Math.floor(this.random()*3);
    return Object.freeze({ predicted, move:(predicted+1)%3, scores, trained:this.samples.length >= 3 });
  }
  play(human) {
    if (![0,1,2].includes(human)) throw new Error('Invalid move');
    // Commit the opponent's choice before learning anything about this round.
    const committed = this.next;
    const result = { human, computer:committed.move, predicted:committed.predicted, scores:committed.scores, trained:committed.trained, outcome:outcome(human,committed.move) };
    if (committed.trained) { this.evaluated++; if (committed.predicted === human) this.correct++; }
    if (this.history.length >= 4) {
      this.samples.push({ input:features(this.history),output:[0,1,2].map(i=>i===human?1:0) });
      if (this.samples.length>80) this.samples.shift();
      this.network.train(this.samples.slice(-24),{ iterations:24,rate:.18,momentum:.05,shuffle:false,error:.005,log:false });
    }
    this.history.push(human); if(this.history.length>120) this.history.shift();
    this.rounds.push(result); if(this.rounds.length>300) this.rounds.shift();
    this.next=this.plan(); return result;
  }
}
