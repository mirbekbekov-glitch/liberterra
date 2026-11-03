document.addEventListener('click',event=>{if(event.target.closest('#placementManualChoice,#lalafoImportButton')){const form=document.getElementById('objectSubmissionForm');if(form)form.hidden=false}},true);

/* Carry an explicit owner intent into the existing form once, without submitting it. */
(()=>{const intent=new URLSearchParams(location.search).get('intent');
 document.addEventListener('DOMContentLoaded',()=>{
 if(!['sale','rent'].includes(intent))return;
 const deal=document.querySelector('#objectSubmissionForm select[name="deal"]');
 if(deal){deal.value=intent==='sale'?'Продажа':'Аренда';deal.dispatchEvent(new Event('change',{bubbles:true}));}
});

})();
