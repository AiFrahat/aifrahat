import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { Chess } from '../vendor/chess.js';
import { features, outcome, NeuralOpponent } from '../games/neural-core.js';
import { generateMaze, shortestPath, movePlayer } from '../games/maze-core.js';
import { parseInfo, LEVELS } from '../games/stockfish-client.js';
import { parseBrief } from '../design-state.mjs';

function library(file, name) {
  let seed = 18;
  const math = Object.create(Math);
  math.random = () => ((seed = (Math.imul(seed,1664525) + 1013904223) >>> 0) / 4294967296);
  const context = { console, setTimeout, clearTimeout, Math:math, Array };
  vm.runInNewContext(readFileSync(new URL(file,import.meta.url),'utf8'),context);
  return context[name];
}
const neataptic=library('../vendor/neataptic.js','neataptic');
const EasyStar=library('../vendor/easystar.min.js','EasyStar');

test('UCI metrics normalize side-to-move scores to White',()=>{
  assert.deepEqual(parseInfo('info depth 14 nodes 4500 score cp -32 pv e7e5 g1f3','b'),{depth:14,nodes:4500,score:32,mate:false,pv:['e7e5','g1f3']});
  assert.equal(parseInfo('info score mate -3','b').score,3);
  assert.equal(parseInfo('info string NNUE loaded').score,null);
  for(const l of Object.values(LEVELS)) assert.ok(l.time<=1800 && l.depth<=20);
});
test('chess rules reject illegal moves and support promotion, castling, checkmate and PGN',()=>{
  const game=new Chess();
  assert.throws(()=>game.move({from:'e2',to:'e5'}));
  for(const move of ['f3','e5','g4','Qh4#']) game.move(move);
  assert.equal(game.isCheckmate(),true);
  const restored=new Chess();restored.loadPgn(game.pgn());assert.equal(restored.fen(),game.fen());
  const promotion=new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');
  promotion.move({from:'a7',to:'a8',promotion:'n'});assert.equal(promotion.get('a8').type,'n');
  const castle=new Chess('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');castle.move('O-O');assert.equal(castle.get('f1').type,'r');
});
test('RPS outcomes and four-move features are correct',()=>{
  for(let h=0;h<3;h++) for(let c=0;c<3;c++) assert.equal(outcome(h,c),h===c?0:(h+2)%3===c?1:-1);
  assert.throws(()=>outcome(3,0));
  assert.deepEqual(features([2,0,1,2,0]),[1,0,0,0,1,0,0,0,1,1,0,0]);
  assert.equal(features([]).length,12);
});
test('neural choice is precommitted and constant patterns are learned',()=>{
  const model=new NeuralOpponent(neataptic,()=>.2);
  for(let i=0;i<20;i++){
    const before=model.next;
    const round=model.play(0);
    assert.equal(round.computer,before.move);
    assert.equal(round.scores,before.scores);
  }
  assert.equal(model.next.predicted,0);
  assert.equal(model.next.move,1);
  assert.ok(model.correct/model.evaluated>.75);
  assert.equal(model.samples.length,16);
  model.reset();assert.equal(model.samples.length,0);assert.equal(model.evaluated,0);
});
test('seeded maps are reproducible and every A* path is walkable',()=>{
  for(let seed=1;seed<=35;seed++){
    const {grid,path}=generateMaze(EasyStar,seed);
    assert.ok(path.length>=21);
    assert.equal(path[0].x,1);assert.equal(path.at(-1).x,11);assert.equal(path.at(-1).y,11);
    for(let i=0;i<path.length;i++){
      assert.equal(grid[path[i].y][path[i].x],0);
      if(i)assert.equal(Math.abs(path[i].x-path[i-1].x)+Math.abs(path[i].y-path[i-1].y),1);
    }
    assert.deepEqual(grid,generateMaze(EasyStar,seed).grid);
  }
});
test('pathfinder and player respect blocked cells and cardinal movement',()=>{
  const {grid}=generateMaze(EasyStar,23),p={x:1,y:1};
  assert.equal(movePlayer(grid,p,-1,0),p);assert.equal(movePlayer(grid,p,1,1),p);
  grid[1][2]=1;grid[2][1]=1;
  assert.equal(shortestPath(EasyStar,grid),null);
});
test('new finishes are parsed in Arabic and English',()=>{
  assert.equal(parseBrief('turquoise rover').design.finish,'turquoise');
  assert.equal(parseBrief('مستكشف تركواز').design.finish,'turquoise');
  assert.equal(parseBrief('lime rover').design.finish,'lime');
});
