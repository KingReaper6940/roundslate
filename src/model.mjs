export const SCHEMA='roundslate-project-v1',MAX_SCORE=999999;
const fail=m=>{throw Error(m);};
function keys(o,n){if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join('|')!==[...n].sort().join('|'))fail('Unsupported project fields.');}
function text(v,max,name,multi=false){if(typeof v!=='string'||v.length>max||[...v].some(c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff)||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v)||(!multi&&/[\r\n]/.test(v)))fail(name+' contains unsupported text or exceeds '+max+' characters.');}
export function parseScore(source){if(typeof source!=='string')fail('Enter an integer score.');const s=source.trim();if(s==='')return null;if(!/^[+-]?\d{1,6}$/.test(s))fail('Scores must be whole numbers from −999999 to 999999, or blank.');const n=Number(s);if(Math.abs(n)>MAX_SCORE)fail('Score is outside the allowed range.');return n===0?0:n;}
export function validate(p){
 keys(p,['schema','title','notes','direction','players','rounds']);if(p.schema!==SCHEMA)fail('Unsupported project version.');text(p.title,80,'Title');if(!p.title.trim())fail('Give this game a title.');text(p.notes,1000,'Game notes',true);if(!['high','low'].includes(p.direction))fail('Choose highest or lowest total.');
 if(!Array.isArray(p.players)||p.players.length<2||p.players.length>8||!Array.isArray(p.rounds)||p.rounds.length>40)fail('Use 2–8 players and up to 40 rounds.');
 const ids=new Set(),names=new Set();for(const x of p.players){keys(x,['id','name']);if(typeof x.id!=='string'||!/^p[1-9]\d{0,5}$/.test(x.id)||ids.has(x.id))fail('Invalid or duplicate player ID.');ids.add(x.id);text(x.name,32,'Player name');if(!x.name.trim()||names.has(x.name.trim().toLowerCase()))fail('Player names must be nonblank and distinct ignoring case.');names.add(x.name.trim().toLowerCase());}
 const rounds=new Set();for(const r of p.rounds){keys(r,['id','label','notes','status','scores']);if(typeof r.id!=='string'||!/^r[1-9]\d{0,5}$/.test(r.id)||rounds.has(r.id))fail('Invalid or duplicate round ID.');rounds.add(r.id);text(r.label,64,'Round label');text(r.notes,200,'Round notes',true);if(!r.label.trim()||!['draft','posted'].includes(r.status))fail('Invalid round label or state.');keys(r.scores,[...ids]);for(const id of ids){const n=r.scores[id];if(n!==null&&(!Number.isInteger(n)||Math.abs(n)>MAX_SCORE))fail('Scores must be integers or null.');if(r.status==='posted'&&n===null)fail('Posted rounds need an explicit score for every player.');}}
 return p;
}
export const clone=p=>structuredClone(validate(p));
export const blank=()=>({schema:SCHEMA,title:'Untitled game',notes:'',direction:'high',players:[{id:'p1',name:'Player 1'},{id:'p2',name:'Player 2'}],rounds:[]});
export function parseProject(source){if(typeof source!=='string'||source.length>150000)fail('Project exceeds 150,000 characters.');return clone(JSON.parse(source));}
export function summarize(p){
 validate(p);const posted=p.rounds.filter(r=>r.status==='posted'),drafts=p.rounds.filter(r=>r.status==='draft');
 const entries=p.players.map((x,index)=>({...x,index,total:posted.reduce((n,r)=>n+r.scores[x.id],0)}));
 const standings=entries.map(x=>({...x,rank:posted.length?1+entries.filter(y=>p.direction==='high'?y.total>x.total:y.total<x.total).length:null})).sort((a,b)=>posted.length?(p.direction==='high'?b.total-a.total:a.total-b.total)||a.index-b.index:a.index-b.index).map(({index,...x})=>x);
 return {posted:posted.length,drafts:drafts.length,rounds:p.rounds.length,standings,leaders:posted.length?standings.filter(x=>x.rank===1).map(x=>x.id):[],roundDetails:p.rounds.map(r=>({id:r.id,status:r.status,entered:p.players.filter(x=>r.scores[x.id]!==null).length,required:p.players.length,total:r.status==='posted'?p.players.reduce((n,x)=>n+r.scores[x.id],0):null}))};
}
