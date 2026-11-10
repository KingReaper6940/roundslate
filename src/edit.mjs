import {clone} from './model.mjs';
export function edit(p,a){
 const q=clone(p),round=()=>{const r=q.rounds.find(r=>r.id===a.id);if(!r)throw Error('Round no longer exists.');return r;};
 switch(a.type){
 case 'settings':{if(!Array.isArray(a.names))throw Error('Enter the player names.');if(q.rounds.length&&a.names.length!==q.players.length)throw Error('Player count is locked after adding rounds. Start a new game to change the roster.');q.title=a.title;q.notes=a.notes;q.direction=a.direction;q.players=a.names.map((name,n)=>({id:q.players[n]?.id??'p'+(n+1),name}));break;}
 case 'add':{let n=1;while(q.rounds.some(r=>r.id==='r'+n))n++;q.rounds.push({id:'r'+n,label:'Round '+(q.rounds.length+1),notes:'',status:'draft',scores:Object.fromEntries(q.players.map(p=>[p.id,null]))});break;}
 case 'round':{const r=round();if(r.status!=='draft')throw Error('Reopen this posted round before correcting scores.');r.label=a.label;r.notes=a.notes;r.scores=structuredClone(a.scores);break;}
 case 'post':{const r=round();if(r.status!=='draft')throw Error('Round is already posted.');if(q.players.some(x=>r.scores[x.id]===null))throw Error('Enter every score explicitly, including zero, before posting.');r.status='posted';break;}
 case 'reopen':{const r=round();if(r.status!=='posted')throw Error('Only a posted round can be reopened.');r.status='draft';break;}
 case 'remove':{const r=round();if(r.status!=='draft')throw Error('Reopen a posted round before deleting it.');q.rounds=q.rounds.filter(r=>r.id!==a.id);break;}
 default:throw Error('Unsupported edit.');
 }
 return clone(q);
}
export function history(initial){let current=clone(initial),past=[],future=[];return {get value(){return clone(current)},get canUndo(){return past.length>0},get canRedo(){return future.length>0},peek(dir){const a=dir==='undo'?past:dir==='redo'?future:null;if(!a)throw Error('Invalid history direction.');return a.length?clone(a.at(-1)):null;},commit(p){const next=clone(p);if(JSON.stringify(next)===JSON.stringify(current))return false;past.push(current);past=past.slice(-25);current=next;future=[];return true;},undo(){if(!past.length)return false;future.push(current);current=past.pop();return true;},redo(){if(!future.length)return false;past.push(current);past=past.slice(-25);current=future.pop();return true;}};}
