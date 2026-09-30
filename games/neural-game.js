import { NeuralOpponent } from './neural-core.js';
import { $, t, copy, icon, icons, loadLibrary } from './ui.js';

const choiceNames=[['حجر','Rock'],['ورق','Paper'],['مقص','Scissors']];
const choiceIcons=['hexagon','hand','scissors'];
export async function mount(root) {
  const lib=await loadLibrary(new URL('../vendor/neataptic.js',import.meta.url).href,'neataptic');
  const opponent=new NeuralOpponent(lib);
  let last=null, total=0, wins=0, losses=0, draws=0;
  root.innerHTML=`<div class="game-workspace neural-workspace"><div class="neural-stage">
    <div class="neural-score"><div>${copy('أنت','YOU')}<strong data-human-score>00</strong></div><span>VS</span><div>${copy('الشبكة','NETWORK')}<strong data-ai-score>00</strong></div></div>
    <div class="duel-match"><div class="duel-choice human" data-human-choice>${icon('user-round')}</div><div class="duel-result"><span data-round-number>ROUND 01</span><h3 data-round-result role="status"></h3><small data-prediction-result></small></div><div class="duel-choice computer" data-ai-choice>${icon('brain-circuit')}</div></div>
    <div class="rps-controls" role="group" aria-label="Your move">${choiceNames.map((n,i)=>`<button type="button" data-rps="${i}">${icon(choiceIcons[i])}${copy(...n)}<small>0${i+1}</small></button>`).join('')}</div>
    <div class="round-history" data-round-history aria-label="Recent rounds"></div>
    <div class="neural-bottom"><span data-commit-state></span><button class="icon-button" data-neural-reset title="Reset learned patterns" aria-label="Reset learned patterns">${icon('rotate-ccw')}</button></div>
  </div><aside class="game-console"><div class="console-heading"><span>INSIDE THE NETWORK</span><i></i></div>
    <div class="network-label"><b>12 → 16 → 3</b><span>BACKPROPAGATION</span></div>
    <canvas class="network-view" width="480" height="250" data-neural-canvas role="img" aria-label="Actual learned network weights"></canvas>
    <div class="engine-metrics"><div>${copy('الجولات','ROUNDS')}<strong data-rounds>0</strong></div><div>${copy('عينات التدريب','TRAINING SAMPLES')}<strong data-samples>0</strong></div><div>${copy('دقة التوقع السابقة','PAST PREDICTION ACCURACY')}<strong data-accuracy>--</strong></div></div>
    <div class="move-list-head">${copy('درجات التوقع للجولة السابقة','PREVIOUS ROUND MODEL SCORES')}</div>
    <div class="prediction-bars">${choiceNames.map((n,i)=>`<div>${copy(...n)}<i><b data-probability="${i}"></b></i><output data-probability-label="${i}">--</output></div>`).join('')}</div>
    <p class="engine-disclosure">${copy('الشبكة تتعلّم داخل هذه الجلسة فقط. تختار قبل ضغطتك، ولا ترى قرارك الحالي. درجاتها ليست احتمالات مُعايرة.','The network learns only in this session. It commits before your click and cannot see your current choice. Scores are not calibrated probabilities.')}</p>
    <span class="engine-source">NEATAPTIC / LOCAL TRAINING / MIT</span>
  </aside></div>`;
  function draw() {
    const canvas=$(root,'[data-neural-canvas]'), ctx=canvas.getContext('2d');
    const w=canvas.width,h=canvas.height; ctx.clearRect(0,0,w,h);
    const nodes=opponent.network.nodes;
    const positions=nodes.map((n,i)=>i<12?{x:45,y:15+i*20}:i<28?{x:240,y:10+(i-12)*15}:{x:435,y:50+(i-28)*75});
    const index=new Map(nodes.map((n,i)=>[n,i]));
    for(const connection of opponent.network.connections){const a=positions[index.get(connection.from)],b=positions[index.get(connection.to)];if(!a||!b)continue; ctx.strokeStyle=connection.weight>0?`rgba(25,212,202,${Math.min(.65,.05+Math.abs(connection.weight)*.18)})`:`rgba(255,107,53,${Math.min(.5,.04+Math.abs(connection.weight)*.15)})`;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    positions.forEach((p,i)=>{ctx.fillStyle=i<12?'#c8ff36':i<28?'#19d4ca':'#ff6b35';ctx.beginPath();ctx.arc(p.x,p.y,i>=28?8:4,0,Math.PI*2);ctx.fill();});
  }
  function render(){
    $(root,'[data-human-score]').textContent=String(wins).padStart(2,'0'); $(root,'[data-ai-score]').textContent=String(losses).padStart(2,'0');
    $(root,'[data-round-number]').textContent=`ROUND ${String(total+1).padStart(2,'0')}`;
    $(root,'[data-round-result]').textContent=!last?t('هل يمكن توقّعك؟','Are you predictable?'):last.outcome===1?t('نقطة لك.','Your point.'):last.outcome===-1?t('نقطة للشبكة.','Network scores.'):t('تعادل.','A draw.');
    $(root,'[data-prediction-result]').textContent=last?`${t('توقّعك السابق','Previous prediction')}: ${t(...choiceNames[last.predicted])}`:t('إنسان × شبكة عصبية','HUMAN × NEURAL NETWORK');
    $(root,'[data-human-choice]').innerHTML=icon(last?choiceIcons[last.human]:'user-round'); $(root,'[data-ai-choice]').innerHTML=icon(last?choiceIcons[last.computer]:'brain-circuit');
    $(root,'[data-commit-state]').textContent=opponent.samples.length<3?t(`مرحلة التعلّم الأولي · ${Math.min(total,7)}/7`,`WARM-UP · ${Math.min(total,7)}/7`):t('اختيار الشبكة للجولة القادمة مُثبت.','NEXT NETWORK MOVE COMMITTED');
    $(root,'[data-rounds]').textContent=total; $(root,'[data-samples]').textContent=opponent.samples.length;
    $(root,'[data-accuracy]').textContent=opponent.evaluated?`${Math.round(opponent.correct/opponent.evaluated*100)}%`:'--';
    for(let i=0;i<3;i++){const value=last?.scores[i];$(root,`[data-probability="${i}"]`).style.width=`${value==null?0:value*100}%`;$(root,`[data-probability-label="${i}"]`).textContent=value==null?'--':`${Math.round(value*100)}%`;}
    $(root,'[data-round-history]').innerHTML=opponent.rounds.slice(-18).map((r,i)=>`<span class="round-dot ${r.outcome===1?'won':r.outcome===-1?'lost':'draw'}" title="${t('جولة','Round')} ${Math.max(0,total-18)+i+1}">${r.outcome===1?'+':r.outcome===-1?'−':'='}</span>`).join('');
    draw();icons();
  }
  root.querySelectorAll('[data-rps]').forEach(b=>b.onclick=()=>{last=opponent.play(Number(b.dataset.rps));total++;if(last.outcome===1)wins++;else if(last.outcome===-1)losses++;else draws++;render();});
  $(root,'[data-neural-reset]').onclick=()=>{opponent.reset();last=null;total=0;wins=0;losses=0;draws=0;render();};
  render();return {render};
}
