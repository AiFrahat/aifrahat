import { generateMaze,shortestPath,movePlayer,MAZE_SIZE } from './maze-core.js';
import { $,t,copy,icon,icons,loadLibrary } from './ui.js';

export async function mount(root){
  const lib=await loadLibrary(new URL('../vendor/easystar.min.js',import.meta.url).href,'EasyStar');
  let seed=23,{grid,path}=generateMaze(lib,seed),player={x:1,y:1},ghost=0,steps=0,running=false,finished=false,editing=false,reveal=false,timer=null,visible=true,result=null;
  root.innerHTML=`<div class="game-workspace maze-workspace"><div class="maze-stage"><div class="map-top"><span>SECTOR <b data-maze-seed>023</b></span><span class="map-legend"><i></i>${copy('أنت','YOU')}<i></i>A*</span></div>
    <div class="maze-grid" data-maze-grid role="application" tabindex="0" aria-label="Path race. Arrow keys move your explorer."></div>
    <div class="maze-controls"><div class="direction-pad" role="group" aria-label="Move explorer"><button class="icon-button up" data-step="0,-1" title="Move up" aria-label="Move up">${icon('arrow-up')}</button><button class="icon-button left" data-step="-1,0" title="Move left" aria-label="Move left">${icon('arrow-left')}</button><button class="icon-button down" data-step="0,1" title="Move down" aria-label="Move down">${icon('arrow-down')}</button><button class="icon-button right" data-step="1,0" title="Move right" aria-label="Move right">${icon('arrow-right')}</button></div><span data-maze-status role="status"></span></div>
    </div><aside class="game-console"><div class="console-heading"><span>PATHFINDING SYSTEM</span><i></i></div><h3>${copy('الهدف واحد. الطريق قرارك.','One destination. Your route.')}</h3>
    <div class="game-settings"><label>${copy('سرعة المنافس','Opponent pace')}<select data-maze-pace><option value="750" data-ar="هادئ" data-en="Steady">${t('هادئ','Steady')}</option><option value="450" selected data-ar="سريع" data-en="Fast">${t('سريع','Fast')}</option><option value="250" data-ar="مكثف" data-en="Intense">${t('مكثف','Intense')}</option></select></label></div>
    <button class="button primary-action" data-maze-start>${icon('play')}<span data-race-label></span></button>
    <div class="engine-metrics"><div>${copy('خطواتك','YOUR STEPS')}<strong data-player-steps>0</strong></div><div>${copy('أقصر مسار','OPTIMAL PATH')}<strong data-optimal>--</strong></div><div>${copy('تقدّم المنافس','AI PROGRESS')}<strong data-ai-progress>0%</strong></div></div>
    <div class="maze-tools"><button class="icon-button" data-maze-new title="New map" aria-label="New map">${icon('shuffle')}</button><button class="icon-button" data-maze-reset title="Replay map" aria-label="Replay map">${icon('rotate-ccw')}</button><button class="icon-button" data-maze-edit aria-pressed="false" title="Edit obstacles" aria-label="Edit obstacles">${icon('brick-wall')}</button><button class="icon-button" data-maze-reveal aria-pressed="false" title="Reveal shortest path" aria-label="Reveal shortest path">${icon('route')}</button></div>
    <div class="path-verdict" data-maze-verdict></div>
    <p class="engine-disclosure">${copy('المنافس يحسب أقصر طريق باستخدام A*. السرعة المختارة تخص الحركة، وليست زمن حساب الخوارزمية.','The opponent computes a shortest path with A*. The selected pace controls movement, not algorithm computation time.')}</p><span class="engine-source">EASYSTAR.JS / A* / MIT</span></aside></div>`;
  const map=$(root,'[data-maze-grid]');
  function stop(){clearInterval(timer);timer=null;running=false;}
  function reset(){stop();player={x:1,y:1};ghost=0;steps=0;finished=false;result=null;}
  function finish(winner){stop();finished=true;result=winner;render();}
  function run(){
    if(finished||editing||!visible||document.hidden)return;
    running=true;clearInterval(timer);timer=setInterval(()=>{ghost=Math.min(path.length-1,ghost+1);if(ghost===path.length-1)finish('ai');else render();},Number($(root,'[data-maze-pace]').value));render();
  }
  function move(dx,dy){
    if(finished||editing||!visible)return;
    const next=movePlayer(grid,player,dx,dy);if(next===player)return;
    if(!running)run();player=next;steps++;if(player.x===11&&player.y===11)finish('human');else render();
  }
  function render(){
    $(root,'[data-maze-seed]').textContent=String(seed).padStart(3,'0');
    $(root,'[data-player-steps]').textContent=steps;$(root,'[data-optimal]').textContent=path.length-1;$(root,'[data-ai-progress]').textContent=`${Math.round(ghost/(path.length-1)*100)}%`;
    $(root,'[data-race-label]').textContent=finished?t('جولة جديدة','Race again'):running?t('إيقاف مؤقت','Pause race'):steps||ghost?t('استكمال السباق','Resume race'):t('ابدأ السباق','Start race');
    $(root,'[data-maze-start]').disabled=editing;
    $(root,'[data-maze-status]').textContent=editing?t('وضع تعديل العوائق','OBSTACLE EDITOR'):finished?result==='human'?t('وصلت أولًا!','YOU ARRIVED FIRST!'):t('وصل A* أولًا.','A* ARRIVED FIRST.'):running?t('السباق جارٍ','RACE IN PROGRESS'):t('جاهز للانطلاق','READY TO RACE');
    $(root,'[data-maze-verdict]').textContent=finished&&result==='human'?t(`${Math.max(0,steps-path.length+1)} خطوة إضافية عن أقصر مسار.`,`${Math.max(0,steps-path.length+1)} extra steps over the shortest route.`):reveal?t('مسار A* ظاهر بالتركواز.','A* ROUTE REVEALED'):'';
    $(root,'[data-maze-edit]').setAttribute('aria-pressed',String(editing));$(root,'[data-maze-reveal]').setAttribute('aria-pressed',String(reveal));
    const ai=path[ghost];map.classList.toggle('is-editing',editing);
    map.innerHTML=grid.flatMap((row,y)=>row.map((wall,x)=>{
      const isPlayer=x===player.x&&y===player.y,isAI=x===ai.x&&y===ai.y,isGoal=x===11&&y===11;
      const onPath=reveal&&path.some(p=>p.x===x&&p.y===y);
      return `<button type="button" tabindex="${editing?'0':'-1'}" class="maze-cell ${wall?'wall':''} ${onPath?'on-path':''} ${isGoal?'goal':''}" data-cell="${x},${y}" aria-label="${x},${y} ${wall?'wall':isGoal?'goal':'floor'}">${isGoal?'<span class="goal-marker">◇</span>':''}${isPlayer?'<span class="explorer human-explorer"></span>':''}${isAI?'<span class="explorer ai-explorer"></span>':''}</button>`;
    })).join('');
  }
  map.addEventListener('keydown',e=>{const d={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]}[e.key];if(d){e.preventDefault();move(...d);}});
  map.addEventListener('click',e=>{const cell=e.target.closest('[data-cell]');if(!cell)return;const [x,y]=cell.dataset.cell.split(',').map(Number);if(editing){if(x===0||y===0||x===12||y===12||(x===1&&y===1)||(x===11&&y===11))return;grid[y][x]=grid[y][x]?0:1;const next=shortestPath(lib,grid);if(!next){grid[y][x]=grid[y][x]?0:1;$(root,'[data-maze-status]').textContent=t('يجب أن يبقى الهدف قابلًا للوصول.','The destination must remain reachable.');return;}path=next;render();}else move(x-player.x,y-player.y);});
  root.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>move(...b.dataset.step.split(',').map(Number)));
  $(root,'[data-maze-start]').onclick=()=>{if(finished)reset();if(running){stop();render();}else run();};
  $(root,'[data-maze-new]').onclick=()=>{reset();seed++;({grid,path}=generateMaze(lib,seed));render();};
  $(root,'[data-maze-reset]').onclick=()=>{reset();render();};
  $(root,'[data-maze-edit]').onclick=()=>{reset();editing=!editing;render();};
  $(root,'[data-maze-reveal]').onclick=()=>{reveal=!reveal;render();};
  $(root,'[data-maze-pace]').onchange=()=>{if(running)run();};
  render();icons();return {render,activate(){visible=true;},deactivate(){visible=false;stop();render();}};
}
