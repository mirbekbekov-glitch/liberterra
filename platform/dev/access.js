(() => {
 window.LiberterraAgentAccess={request:async(action,data={})=>{
  const url=['get_agent_dashboard','list_agent_private_access'].includes(action)?'/__dev/read':'/api/crm-action';
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})});
  const result=await response.json();if(!response.ok||result.ok===false){const e=new Error(result.error==='registration_required'?'Выберите тестового агента в верхней панели.':result.error==='agent_not_approved'?'У тестового аккаунта нет допуска агента.':result.error||'Ошибка стенда');e.code=result.error;throw e;}return result;
 },hasUserSession:()=>true};
})();
