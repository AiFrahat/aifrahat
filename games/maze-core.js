export const MAZE_SIZE=13;
export function shortestPath(EasyStar,grid,start={x:1,y:1},goal={x:11,y:11}) {
  const finder=new EasyStar.js();let result=null;
  finder.setGrid(grid);finder.setAcceptableTiles([0]);finder.enableSync();
  finder.findPath(start.x,start.y,goal.x,goal.y,path=>{result=path;});finder.calculate();return result;
}
export function generateMaze(EasyStar,seed=1){
  let s=seed>>>0;
  const random=()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};
  for(let attempt=0;attempt<60;attempt++){
    const grid=Array.from({length:MAZE_SIZE},(_,y)=>Array.from({length:MAZE_SIZE},(_,x)=>x===0||y===0||x===12||y===12?1:random()<.26?1:0));grid[1][1]=0;grid[11][11]=0;
    const path=shortestPath(EasyStar,grid);
    if(path&&path.length>=23)return {grid,path};
  }
  const grid=Array.from({length:MAZE_SIZE},(_,y)=>Array.from({length:MAZE_SIZE},(_,x)=>x===0||y===0||x===12||y===12?1:0));
  return {grid,path:shortestPath(EasyStar,grid)};
}
export function movePlayer(grid,position,dx,dy){
  if(Math.abs(dx)+Math.abs(dy)!==1)return position;
  const x=position.x+dx,y=position.y+dy;
  return grid[y]?.[x]===0?{x,y}:position;
}
