import {blank,clone,parseProject,validate} from './model.mjs';
export const STORAGE_KEY='roundslate-project-v1';
export function localStore(storage,key=STORAGE_KEY){
 let observed=null,initial=blank(),mode='ready',message='No browser copy yet. Save game setup or add a round to start.',blocked=false;
 function unavailable(){mode='memory';message='Browser saving unavailable. Work stays in memory only; download a project backup.';blocked=false;}
 try{observed=storage.getItem(key);if(observed!==null){try{initial=parseProject(observed);message='Restored this browser’s saved project.';}catch{mode='invalid';blocked=true;message='The browser copy is invalid or unsupported. It has been preserved. Open a backup or explicitly replace it with this tab.';}}}catch{unavailable();}
 function observe(){if(mode==='memory')return;try{if(storage.getItem(key)!==observed){mode='conflict';blocked=true;message='The browser copy changed in another tab. Export this tab first, then choose which copy to keep.';}}catch{unavailable();}}
 function save(p,force=false){
  const source=JSON.stringify(validate(p));if(mode==='memory'&&!force)return {applied:true,persisted:false};
  try{
   const now=storage.getItem(key);
   if(!force&&(blocked||now!==observed)){mode='conflict';blocked=true;message='The browser copy changed or needs review. Export this tab before choosing a copy.';return {applied:false,persisted:false};}
   storage.setItem(key,source);observed=source;mode='saved';blocked=false;message='Saved in this browser. Download JSON for a portable backup.';return {applied:true,persisted:true};
  }catch{unavailable();return {applied:true,persisted:false};}
 }
 function readExternal(){
  try{const raw=storage.getItem(key),p=raw===null?blank():parseProject(raw);observed=raw;mode='ready';blocked=false;message=raw===null?'Browser copy is empty.':'Loaded the current browser copy.';return clone(p);}
  catch(e){mode='invalid';blocked=true;message='Cannot load browser copy: '+e.message;throw Error(message);}
 }
 return {get initial(){return clone(initial)},get state(){return {mode,message,blocked}},observe,save,readExternal};
}
