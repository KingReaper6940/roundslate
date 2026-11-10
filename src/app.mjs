import {parseScore,blank,summarize} from './model.mjs';import {example} from './example.mjs';import {edit,history} from './edit.mjs';import {localStore,STORAGE_KEY} from './storage.mjs';import {esc} from './export.mjs';import {attachHandoff} from './handoff.mjs';
export function createApp(doc,win=doc.defaultView,suppliedStorage){
 const $=s=>doc.querySelector(s),forms={settings:$('#settings-form'),round:$('#round-form')},field=(f,n)=>forms[f].elements.namedItem(n);
 let storage=suppliedStorage;if(storage===undefined){try{storage=win.localStorage;}catch{storage={getItem(){throw Error('Unavailable');}};}}
 const store=localStore(storage),h=history(store.initial),dirty=new Set();let selected=null,revision=0,onChange=()=>{};
 const status=m=>{$('#status').textContent=m;},checkDraft=except=>{if([...dirty].some(k=>k!==except))throw Error('Save or revert editor drafts before another action.');},checkEdit=except=>{checkDraft(except);if(store.state.blocked)throw Error(store.state.message);};
 const chooseDefault=()=>{const rs=h.value.rounds;selected=rs.find(r=>r.status==='draft')?.id??rs.at(-1)?.id??null;};
 function fillSettings(){const p=h.value;for(const k of ['title','notes','direction'])field('settings',k).value=p[k];field('settings','names').value=p.players.map(x=>x.name).join('\n');}
 function fillRound(){
  const p=h.value,r=p.rounds.find(r=>r.id===selected),locked=!r||r.status!=='draft'||store.state.blocked;
  $('#round-heading').textContent=r?r.label+' · '+r.id:'Round editor';$('#round-state').textContent=r?r.status:'NO ROUND SELECTED';
  $('#round-help').textContent=!r?'Add a draft round or select a ledger row.':r.status==='posted'?'This round is posted. Reopen it from the ledger to correct scores.':'Enter round point changes, not running totals. Blank is unset; save drafts before posting.';
  field('round','label').value=r?.label??'';field('round','notes').value=r?.notes??'';field('round','label').disabled=locked;field('round','notes').disabled=locked;
  $('#score-inputs').innerHTML=r?p.players.map(x=>'<label>'+esc(x.name)+'<input name="'+x.id+'" inputmode="numeric" value="'+(r.scores[x.id]??'')+'" '+(locked?'disabled':'')+' aria-label="'+esc(x.name+' round score')+'"></label>').join(''):'';
  $('#save-round').disabled=locked;$('#post-round').disabled=locked||p.players.some(x=>r?.scores[x.id]===null);$('#round-clear').disabled=!r;
 }
 function persist(p,force=false){const result=store.save(p,force);if(!result.applied){render();throw Error(store.state.message);}return result;}
 function commit(p,force=false){persist(p,force);h.commit(p);revision++;}
 function render(){
  const p=h.value,s=summarize(p),st=store.state;if(!p.rounds.some(r=>r.id===selected))chooseDefault();
  $('#game-title').textContent=p.title;$('#direction').textContent=p.direction==='high'?'HIGHEST TOTAL LEADS':'LOWEST TOTAL LEADS';$('#basis').textContent=s.posted+' posted rounds counted · '+s.drafts+' draft rounds excluded';
  $('#standings').innerHTML=s.standings.map(x=>'<div class="standing '+(x.rank===1?'leader':'')+'"><div class="name">'+esc(x.name)+'</div><div class="total">'+x.total+'</div><small>'+(x.rank===null?'No posted result':'Rank '+x.rank)+' · posted only</small></div>').join('');
  $('#lead').textContent=s.posted?(s.leaders.length>1?'Tied posted lead: ':'Current posted lead: ')+s.leaders.map(id=>p.players.find(x=>x.id===id).name).join(', '):'No posted rounds yet. Draft scores are not standings.';
  $('#ledger-head').innerHTML='<tr><th>Round / actions</th>'+p.players.map(x=>'<th>'+esc(x.name)+'</th>').join('')+'</tr>';
  $('#ledger').innerHTML=p.rounds.map(r=>{const count=p.players.filter(x=>r.scores[x.id]!==null).length;return '<tr><td><strong>'+esc(r.label)+'</strong><small>'+esc(r.id+' · '+r.status+' · '+count+'/'+p.players.length+' entered')+'</small><div class="toolbar"><button type="button" data-action="view" data-id="'+r.id+'">'+(r.status==='posted'?'View':'Edit draft')+'</button>'+(r.status==='posted'?'<button type="button" data-action="reopen" data-id="'+r.id+'" '+(st.blocked?'disabled':'')+'>Reopen</button>':'<button type="button" data-action="post" data-id="'+r.id+'" '+(st.blocked||count!==p.players.length?'disabled':'')+'>Post</button><button type="button" data-action="remove" data-id="'+r.id+'" '+(st.blocked?'disabled':'')+'>Delete draft</button>')+'</div></td>'+p.players.map(x=>'<td>'+(r.scores[x.id]??'—')+'</td>').join('')+'</tr>';}).join('')||'<tr><td colspan="'+(p.players.length+1)+'">No rounds yet. Add a draft after setting up the roster.</td></tr>';
  $('#save-status').textContent=st.message;$('#save-status').classList.toggle('warning',st.mode==='memory'||st.blocked);$('#reconcile').hidden=!st.blocked&&st.mode!=='memory';
  if(!dirty.has('settings'))fillSettings();if(!dirty.has('round'))fillRound();$('#add-round').disabled=st.blocked||p.rounds.length>=40;$('#undo').disabled=st.blocked||!h.canUndo;$('#redo').disabled=st.blocked||!h.canRedo;onChange();
 }
 const run=fn=>{try{fn();}catch(e){status(e.message);}};
 for(const [kind,form] of Object.entries(forms)){
  const changed=()=>{dirty.add(kind);revision++;status('Unsaved '+kind+' editor draft. Save or revert it before other actions or exports.');onChange();};form.addEventListener('input',changed);form.addEventListener('change',changed);
  $('#'+kind+'-clear').addEventListener('click',()=>{dirty.delete(kind);revision++;render();status('Editor draft reverted.');});
  form.addEventListener('submit',e=>{e.preventDefault();run(()=>{checkEdit(kind);let action;if(kind==='settings'){const names=field(kind,'names').value.trim().split(/\r?\n/).map(n=>n.trim());action={type:'settings',title:field(kind,'title').value,notes:field(kind,'notes').value,direction:field(kind,'direction').value,names};}
   else{if(!selected)throw Error('Select a draft round.');action={type:'round',id:selected,label:field(kind,'label').value,notes:field(kind,'notes').value,scores:Object.fromEntries(h.value.players.map(x=>[x.id,parseScore(field(kind,x.id).value)]))};}
   commit(edit(h.value,action));dirty.delete(kind);render();status('Saved. '+store.state.message);});});
 }
 $('#add-round').addEventListener('click',()=>run(()=>{checkEdit();const p=edit(h.value,{type:'add'});commit(p);selected=p.rounds.at(-1).id;render();$('#score-inputs input')?.focus();status('Draft round added. Enter and save scores, then post when complete.');}));
 $('#ledger').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;run(()=>{checkDraft();const {action,id}=b.dataset;if(action==='view'){selected=id;render();$('#score-inputs input:not(:disabled)')?.focus();return;}checkEdit();commit(edit(h.value,{type:action,id}));selected=action==='remove'?null:id;render();status(action==='reopen'?'Round reopened and removed from standings until posted again.':action==='post'?'Round posted. Totals now include it.':'Draft round deleted. Undo is available.');});});
 $('#post-round').addEventListener('click',()=>run(()=>{checkEdit();commit(edit(h.value,{type:'post',id:selected}));render();status('Round posted. Totals now include it.');}));
 for(const [id,maker] of [['demo',example],['new',blank]])$('#'+id).addEventListener('click',()=>run(()=>{checkEdit();commit(maker());chooseDefault();render();status(id==='new'?'New game ready. Save roster names before adding rounds. Undo restores the previous game.':'Invented example loaded. All posted players are tied; draft scores are excluded.');}));
 for(const dir of ['undo','redo'])$('#'+dir).addEventListener('click',()=>run(()=>{checkEdit();const p=h.peek(dir);if(!p)return;persist(p);h[dir]();revision++;chooseDefault();render();status(dir==='undo'?'Undone.':'Redone.');}));
 $('#use-browser').addEventListener('click',()=>run(()=>{checkDraft();h.commit(store.readExternal());revision++;chooseDefault();render();status('Browser copy loaded. The previous tab ledger is in Undo history.');}));
 $('#use-local').addEventListener('click',()=>run(()=>{checkDraft();persist(h.value,true);revision++;render();status(store.state.message);}));
 win.addEventListener('storage',e=>{if(e.key===STORAGE_KEY||e.key===null){store.observe();revision++;render();}});
 win.addEventListener('beforeunload',e=>{if(dirty.size||store.state.mode==='memory'||store.state.blocked){e.preventDefault();e.returnValue='';}});
 chooseDefault();render();
 return {get value(){return h.value},get revision(){return revision},get dirty(){return dirty.size>0},get saveState(){return store.state},status,load(p){checkDraft();commit(p,true);chooseDefault();render();status('Project opened and saved if storage is available. Undo restores the previous game.');},subscribe(fn){onChange=fn;fn();}};
}
if(typeof document!=='undefined')attachHandoff(createApp(document),document);
