// One active job per renderer keeps mesh uploads and portrait projections
// bounded even when a large group appears in the same doorway.
export function avatarJobs(){
  let worker=null,failed=false,callback=null;
  function stop(){
    worker?.terminate();worker=null;failed=true;
    const done=callback;callback=null;done?.(null);
  }
  return {
    get supported(){return !failed&&typeof Worker==='function';},
    get busy(){return !!callback;},
    run(message,done){
      if(callback||failed)return false;
      try{
        if(!worker){
          worker=new Worker(new URL('./avatar-worker.js',import.meta.url),{type:'module'});
          worker.onmessage=e=>{const finish=callback;callback=null;finish?.(e.data);};
          worker.onerror=worker.onmessageerror=stop;
        }
        callback=done;worker.postMessage(message);return true;
      }catch{stop();return false;}
    },
    dispose:stop
  };
}
