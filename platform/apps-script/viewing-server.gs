// Add as a separate Apps Script file. Requires the existing authenticated catalog helpers.
// No public activation until persistence, authorization and UI have been verified live.
function viewingTime_(day, time, now) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw Error('invalid_time');
  const at = Date.parse(day + 'T' + time + ':00+06:00');
  if (!Number.isFinite(at) || new Date(at + 21600000).toISOString().slice(0,16) !== day+'T'+time
      || at <= now || at > now + 90*86400000) throw Error('invalid_time');
  return at;
}

function viewingChange_(record, actor, payload, now) {
  if (String(record.client_id) !== actor && String(record.agent_id) !== actor) throw Error('forbidden');
  if (Number(payload.version) !== record.version) throw Error('version_conflict');
  const agent = String(record.agent_id) === actor;
  const next = String(payload.status || '');
  const allowed = agent
    ? {pending:['confirmed','proposed','cancelled'],proposed:['proposed','cancelled'],confirmed:['completed','proposed','cancelled']}
    : {pending:['cancelled'],proposed:['confirmed','cancelled'],confirmed:['cancelled']};
  if (!(allowed[record.status] || []).includes(next)) throw Error('invalid_transition');
  const updated = JSON.parse(JSON.stringify(record));
  if (next === 'proposed') {
    viewingTime_(payload.day, payload.time, now);
    updated.day = payload.day; updated.time = payload.time;
  }
  if (next === 'confirmed') viewingTime_(updated.day, updated.time, now);
  if (next === 'completed' && Date.parse(updated.day+'T'+updated.time+':00+06:00') > now) throw Error('too_early');
  updated.status = next; updated.version++;
  updated.updated_at = new Date(now).toISOString();
  updated.events.push({status:next,by:actor,at:updated.updated_at,day:updated.day,time:updated.time});
  if (updated.events.length > 100) throw Error('too_many_changes');
  return updated;
}

function viewingAction_(payload, action) {
  if (PropertiesService.getScriptProperties().getProperty('VIEWING_ACCOUNT_ENABLED') !== 'true') return {ok:false,error:'feature_disabled'};
  const context = registeredUserContext_(payload);
  if (!context.ok) return context;
  const actor = String(context.telegramId), now = Date.now();
  const testers = String(PropertiesService.getScriptProperties().getProperty('VIEWING_TEST_USER_IDS') || '')
    .split(',').map(x=>x.trim()).filter(Boolean);
  // During pilot, fail closed even if the enable switch is accidentally set.
  // Registered users are authorized below per record.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return {ok:false,error:'busy_retry'};
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = book.getSheetByName('ViewingRequests');
    const values = sheet ? sheet.getDataRange().getDisplayValues().slice(1) : [];
    const records = values.map((row, i) => ({row:i+2,record:JSON.parse(row[1])}));
    if (action === 'list_viewings') {
      return {ok:true,viewer_id:actor,viewings:records.map(x=>x.record)
        .filter(r=>r.client_id===actor || r.agent_id===actor)
        .sort((a,b)=>b.created_at.localeCompare(a.created_at))};
    }
    let result, row;
    if (action === 'create_viewing') {
      if (payload.consent !== true) return {ok:false,error:'consent_required'};
      const key = String(payload.request_key || '');
      if (!/^[a-zA-Z0-9-]{16,80}$/.test(key)) return {ok:false,error:'invalid_request_key'};
      const objectId = normalizeObjectId_(payload.object_id);
      const duplicate = records.find(x=>x.record.client_id===actor && x.record.request_key===key);
      if (duplicate) {
        const r = duplicate.record;
        if (r.object_id!==objectId || r.original_day!==payload.day || r.original_time!==payload.time) return {ok:false,error:'request_key_conflict'};
        return {ok:true,viewing:r,duplicate:true};
      }
      viewingTime_(payload.day, payload.time, now);
      const object = getObjectRecordById_(objectId, catalogRows_());
      if (!isPublicCrmObject_(object)) return {ok:false,error:'object_unavailable'};
      const agentId = String(listingAgentIdForObject_(objectId, objectAgentLinks_(true)) || '');
      // Assigned agent must still be approved.
      const agent = agentId ? agentRecordById_(agentId) : null;
      if (!agent || agent.role !== 'approved') return {ok:false,error:'agent_unavailable'};
      if (agentId===actor) return {ok:false,error:'own_object'};
      const same = records.find(x=>x.record.client_id===actor && x.record.object_id===objectId && ['pending','proposed','confirmed'].includes(x.record.status));
      if (same) return {ok:false,error:'active_request_exists'};
      if (records.filter(x=>x.record.client_id===actor && Date.parse(x.record.created_at)>now-86400000).length>=20) return {ok:false,error:'daily_limit'};
      result = {id:Utilities.getUuid(),request_key:key,object_id:objectId,client_id:actor,agent_id:agentId,
        client_name:cleanText_(context.name).slice(0,120),day:payload.day,time:payload.time,
        original_day:payload.day,original_time:payload.time,status:'pending',version:1,
        created_at:new Date(now).toISOString(),updated_at:new Date(now).toISOString(),
        events:[{status:'pending',by:actor,at:new Date(now).toISOString(),day:payload.day,time:payload.time}]};
      row = sheet ? sheet.getLastRow()+1 : 2;
    } else if (action === 'update_viewing') {
      const found = records.find(x=>x.record.id===String(payload.id));
      if (!found || (found.record.client_id!==actor && found.record.agent_id!==actor)) return {ok:false,error:'not_found'};
      if (found.record.agent_id===actor && !approvedAgentContext_(payload,context).ok) return {ok:false,error:'agent_unavailable'};
      result = viewingChange_(found.record,actor,payload,now); row=found.row;
    } else return {ok:false,error:'unknown_action'};
    if (!sheet) {sheet=book.insertSheet('ViewingRequests');sheet.appendRow(['id','record']);}
    // One cell contains the state and its audit trail: no split write between two sheets.
    sheet.getRange(row,1,1,2).setValues([[result.id,JSON.stringify(result)]]);
    SpreadsheetApp.flush();
    const persisted = JSON.parse(sheet.getRange(row,2).getValue());
    if (persisted.id!==result.id || persisted.version!==result.version) return {ok:false,error:'save_unconfirmed'};
    return {ok:true,viewing:persisted};
  } catch(e) {
    const known=['invalid_time','forbidden','version_conflict','invalid_transition','too_early','too_many_changes'];
    return {ok:false,error:known.includes(e.message)?e.message:'viewing_storage_error'};
  } finally {lock.releaseLock();}
}

function configureViewingPilot() {
  const rows = readPublicSheetRows_(getAgentsSheet_(), AGENT_HEADERS);
  const targets = ['mirbekbekov','liberterra1'];
  const ids = targets.map(username => {
    const found = rows.filter(r => cleanText_(r.Username).replace(/^@/,'').toLowerCase() === username);
    if (found.length !== 1 || !/^\d+$/.test(found[0].telegram_id) || roleFromStatus_(found[0]['Статус']) !== 'approved') throw Error('Pilot identity not uniquely approved: '+username);
    return found[0].telegram_id;
  });
  const owner = listingAgentIdForObject_('143', objectAgentLinks_(true));
  if (String(owner) !== ids[1]) throw Error('Object 143 owner mismatch');
  PropertiesService.getScriptProperties().setProperties({VIEWING_TEST_USER_IDS:ids.join(','),VIEWING_ACCOUNT_ENABLED:'true'});
  console.log('PILOT_CONFIGURED: '+targets.join(', ')+'. Object 143 verified. Not publicly activated.');
}
