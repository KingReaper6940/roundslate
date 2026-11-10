import {parseProject} from './model.mjs';import {projectJSON,receiptJSON,ledgerHTML,scoresCSV,standingsSVG} from './export.mjs';
export async function readProjectFile(file){if(!file||!Number.isInteger(file.size)||file.size>600000)throw Error('Project file exceeds 600,000 bytes.');const b=await file.arrayBuffer();if(b.byteLength>600000)throw Error('Project file exceeds 600,000 bytes.');return parseProject(new TextDecoder('utf-8',{fatal:true}).decode(b));}
export function attachHandoff(app,doc,win=doc.defaultView){
 const links=[['project-download','application/json',projectJSON],['receipt-download','application/json',receiptJSON],['html-download','text/html',ledgerHTML],['csv-download','text/csv',scoresCSV],['svg-download','image/svg+xml',standingsSVG]];let urls=[],sequence=0;
 function refresh(){for(const u of urls)win.URL.revokeObjectURL(u);urls=[];for(const [id,type,format] of links){const a=doc.getElementById(id);a.removeAttribute('href');a.setAttribute('aria-disabled',String(app.dirty));if(!app.dirty){const u=win.URL.createObjectURL(new win.Blob([format(app.value)],{type:type+';charset=utf-8'}));urls.push(u);a.setAttribute('href',u);}}}
 for(const [id] of links)doc.getElementById(id).addEventListener('click',e=>{if(app.dirty){e.preventDefault();app.status('Save or revert editor drafts before downloading.');}});
 const input=doc.getElementById('project-file');input.addEventListener('change',async()=>{const seq=++sequence,start=app.revision,file=input.files?.[0];if(!file)return;if(app.dirty){app.status('Save or revert editor drafts before opening a project.');input.value='';return;}
  try{const p=await readProjectFile(file);if(seq!==sequence||start!==app.revision){if(seq===sequence)app.status('Project not opened because the ledger, an editor draft or browser copy changed. Choose the file again.');return;}app.load(p);}
  catch(e){if(seq===sequence&&start===app.revision)app.status('Could not open project: '+e.message);}
  finally{if(seq===sequence)input.value='';}
 });
 win.addEventListener('pagehide',()=>{for(const u of urls)win.URL.revokeObjectURL(u);urls=[];});win.addEventListener('pageshow',refresh);app.subscribe(refresh);
}
