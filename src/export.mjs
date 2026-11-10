import {validate,summarize} from './model.mjs';
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const projectJSON=p=>JSON.stringify(validate(p),null,2)+'\n';
export const receipt=p=>({schema:'roundslate-receipt-v1',project:validate(p),summary:summarize(p)});
export const receiptJSON=p=>JSON.stringify(receipt(p),null,2)+'\n';
const cell=v=>'"'+String(v).replace(/"/g,'""')+'"';
export function scoresCSV(p){
 validate(p);const guard=s=>/^[\s]*[=+\-@]/.test(s)?"'"+s:s,s=summarize(p),totals=new Map(s.standings.map(x=>[x.id,x.total]));
 const rows=[['Round ID','Round label','State','Notes',...p.players.map(x=>x.id+' · '+x.name)],...p.rounds.map(r=>[r.id,guard(r.label),r.status,guard(r.notes),...p.players.map(x=>r.scores[x.id]??'')]),['','TOTALS — POSTED ONLY','','',...p.players.map(x=>totals.get(x.id))]];
 return rows.map(r=>r.map(cell).join(',')).join('\r\n')+'\r\n';
}
const chunks=(s,n)=>{const a=[...s];return Array.from({length:Math.ceil(a.length/n)},(_,i)=>a.slice(i*n,(i+1)*n).join(''));};
export function standingsSVG(p){
 const s=summarize(p),height=210+s.standings.length*100,max=Math.max(1,...s.standings.map(x=>Math.abs(x.total)));
 let b='<rect width="1000" height="'+height+'" fill="#f5f1e8"/>'+chunks(p.title,48).map((t,i)=>'<text x="35" y="'+(40+i*25)+'" font-size="23" font-weight="700">'+esc(t)+'</text>').join('');
 b+='<text x="35" y="107" font-size="15">'+s.posted+' posted rounds counted · '+s.drafts+' drafts excluded · '+(p.direction==='high'?'highest':'lowest')+' total leads</text><text x="500" y="140" font-size="12">0</text>';
 s.standings.forEach((x,i)=>{const y=155+i*100,w=Math.abs(x.total)/max*330,start=x.total<0?500-w:500;b+=chunks(x.name,22).map((t,j)=>'<text x="35" y="'+(y+21+j*19)+'" font-size="16" font-weight="700">'+esc(t)+'</text>').join('')+'<text x="35" y="'+(y+70)+'" font-size="12">'+(x.rank===null?'No posted result':'Rank '+x.rank)+'</text><line x1="500" x2="500" y1="'+y+'" y2="'+(y+75)+'" stroke="#92988a"/><rect x="'+start+'" y="'+(y+28)+'" width="'+w+'" height="24" rx="3" fill="'+(x.total<0?'#946443':'#436b58')+'"/><text x="860" y="'+(y+48)+'" font-size="17">'+x.total+'</text>';});
 b+='<text x="35" y="'+(height-20)+'" font-size="13">Roundslate · current posted totals, not a game-rule or final-winner decision · tied totals share rank</text>';
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 '+height+'" role="img" aria-label="Posted round standings" font-family="Arial,sans-serif"><title>'+esc(p.title)+'</title>'+b+'</svg>';
}
export function ledgerHTML(p){
 const s=summarize(p);return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(p.title)+' · score ledger</title><style>body{font:15px/1.6 system-ui,sans-serif;max-width:1100px;margin:30px auto;padding:20px;color:#263c31}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #aaa;padding:9px;text-align:left;overflow-wrap:anywhere}thead{display:table-header-group}tr{break-inside:avoid}p{white-space:pre-wrap;overflow-wrap:anywhere}h1,h2{overflow-wrap:anywhere}@media print{body{margin:0;max-width:none}}</style><body><h1>'+esc(p.title)+'</h1><p>'+s.posted+' posted rounds counted; '+s.drafts+' drafts excluded. '+(p.direction==='high'?'Highest':'Lowest')+' total leads. Ties share competition rank (1, 1, 3). No game-specific rules or final winner are inferred.</p><h2>Posted standings</h2><table><thead><tr><th>Rank</th><th>Player</th><th>Posted total</th></tr></thead><tbody>'+s.standings.map(x=>'<tr><td>'+(x.rank??'—')+'</td><td>'+esc(x.id+' · '+x.name)+'</td><td>'+x.total+'</td></tr>').join('')+'</tbody></table><h2>Complete round ledger</h2><p>— means unset; 0 is an entered zero. Draft scores appear here but do not affect totals.</p><table><thead><tr><th>ID / round</th><th>State</th>'+p.players.map(x=>'<th>'+esc(x.id+' · '+x.name)+'</th>').join('')+'<th>Notes</th></tr></thead><tbody>'+p.rounds.map(r=>'<tr><td>'+esc(r.id+' · '+r.label)+'</td><td>'+r.status+'</td>'+p.players.map(x=>'<td>'+(r.scores[x.id]??'—')+'</td>').join('')+'<td>'+esc(r.notes)+'</td></tr>').join('')+'</tbody></table><h2>Game notes</h2><p>'+esc(p.notes)+'</p><footer>Roundslate · complete ledger snapshot. Keep project JSON to resume. Use browser Print / Save as PDF.</footer></body></html>';
}
