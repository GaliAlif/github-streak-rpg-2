const API='https://api.github.com';
const $=s=>document.querySelector(s);
const state={user:null,repos:[],xp:0,level:1,achievements:[],quests:[]};
const QUESTS=[
 {id:'readme',icon:'⌁',title:'Polish your README',desc:'Improve one section of a project README.',xp:15},
 {id:'issue',icon:'◇',title:'Review an open issue',desc:'Read or respond to an issue on a project.',xp:12},
 {id:'learn',icon:'✦',title:'Learn for 25 minutes',desc:'Study a coding, math, or engineering concept.',xp:20},
 {id:'commit',icon:'⌘',title:'Ship one meaningful change',desc:'Make a useful local change and commit it yourself.',xp:25}
];
const ACHIEVEMENTS=[
 {id:'first-repo',icon:'◆',title:'First Forge',desc:'Own at least 1 public repository.',test:u=>u.public_repos>=1},
 {id:'five-repos',icon:'◇',title:'Guild Founder',desc:'Own at least 5 public repositories.',test:u=>u.public_repos>=5},
 {id:'stars',icon:'★',title:'First Star',desc:'Earn at least 1 star across public repositories.',test:(u,r)=>r.some(x=>x.stargazers_count>0)},
 {id:'followers',icon:'✦',title:'Known Developer',desc:'Reach 10 followers.',test:u=>u.followers>=10},
 {id:'fork',icon:'⑂',title:'Open Source Spark',desc:'Have a repository with at least 1 fork.',test:(u,r)=>r.some(x=>x.forks_count>0)},
 {id:'veteran',icon:'◷',title:'Code Veteran',desc:'GitHub account is at least 3 years old.',test:u=>accountAgeYears(u.created_at)>=3}
];
function fmt(n){return new Intl.NumberFormat().format(n??0)}
function accountAgeYears(date){return (Date.now()-new Date(date).getTime())/(365.25*864e5)}
function xpFor(u,repos){const stars=repos.reduce((a,r)=>a+(r.stargazers_count||0),0),forks=repos.reduce((a,r)=>a+(r.forks_count||0),0);return Math.round(Math.min(5000,u.public_repos*20+stars*5+forks*8+u.followers*3))}
function levelFor(xp){return Math.floor(xp/100)+1}
function levelTitle(l){return ['INITIATE','BUILDER','CRAFTSMAN','ARCHITECT','ENGINEER','VETERAN','MAESTRO','LEGEND'][Math.min(7,l-1)]}
function localKey(){return state.user?`gsr:${state.user.login.toLowerCase()}`:'gsr:guest'}
function getLocal(){try{return JSON.parse(localStorage.getItem(localKey())||'{}')}catch{return {}}}
function saveLocal(data){localStorage.setItem(localKey(),JSON.stringify(data))}
function today(){return new Date().toISOString().slice(0,10)}
function loadQuests(){const d=getLocal(); if(d.questDate!==today()){return {done:[],bonusXp:0}} return {done:Array.isArray(d.done)?d.done:[],bonusXp:Number(d.bonusXp)||0}}
function renderProfile(){const u=state.user;$('#avatar').src=u.avatar_url;$('#avatar').alt=`${u.login} avatar` ;$('#profileLogin').textContent=`@${u.login}`;$('#profileName').textContent=u.name||u.login;$('#profileBio').textContent=u.bio||'No public bio.';$('#profileLocation').textContent=`◎ ${u.location||'Location unavailable'}`;$('#profileLink').href=u.html_url;$('#repoCount').textContent=fmt(u.public_repos);$('#followerCount').textContent=fmt(u.followers);$('#followingCount').textContent=fmt(u.following);$('#statRepos').textContent=fmt(u.public_repos);$('#statStars').textContent=fmt(state.repos.reduce((a,r)=>a+(r.stargazers_count||0),0));$('#statForks').textContent=fmt(state.repos.reduce((a,r)=>a+(r.forks_count||0),0));$('#statAge').textContent=`${accountAgeYears(u.created_at).toFixed(1)}y`;$('#statAgeDetail').textContent=`Since ${new Date(u.created_at).toLocaleDateString(undefined,{month:'short',year:'numeric'})}`}
function renderLevel(){const base=state.xp%100;state.level=levelFor(state.xp);$('#levelValue').textContent=state.level;$('#levelTitle').textContent=levelTitle(state.level);$('#xpValue').textContent=`${fmt(state.xp)} XP`;$('#xpNext').textContent=`/ ${fmt(state.level*100)} XP`;$('#xpBar').style.width=`${base}%`;$('#xpProgress').textContent=`${base} / 100`;$('#xpRule').textContent='Estimate: repos ×20 + stars ×5 + forks ×8 + followers ×3.'}
function renderQuests(){const q=state.quests;$('#questList').innerHTML=QUESTS.map(x=>{const done=q.done.includes(x.id);return `<div class="quest ${done?'done':''}"><div class="quest-icon">${x.icon}</div><div><div class="quest-title">${x.title}</div><div class="quest-desc">${x.desc}</div></div><div><span class="quest-xp">+${x.xp} XP</span><button class="quest-check" data-quest="${x.id}" aria-label="${done?'Undo':'Complete'} ${x.title}">${done?'✓':'○'}</button></div></div>`}).join('');document.querySelectorAll('[data-quest]').forEach(b=>b.addEventListener('click',()=>toggleQuest(b.dataset.quest)))}
function toggleQuest(id){const q=state.quests,idx=q.done.indexOf(id),quest=QUESTS.find(x=>x.id===id);if(idx>=0){q.done.splice(idx,1);q.bonusXp=Math.max(0,(q.bonusXp||0)-quest.xp)}else{q.done.push(id);q.bonusXp=(q.bonusXp||0)+quest.xp}saveLocal({questDate:today(),done:q.done,bonusXp:q.bonusXp});state.xp=xpFor(state.user,state.repos)+q.bonusXp;renderQuests();renderLevel();renderAchievements();toast(idx>=0?'Quest unchecked.':'Quest complete. XP earned locally.')}
function renderAchievements(){const unlocked=ACHIEVEMENTS.filter(a=>a.test(state.user,state.repos));$('#achievementCount').textContent=`${unlocked.length} / ${ACHIEVEMENTS.length}`;$('#achievementList').innerHTML=ACHIEVEMENTS.map(a=>{const yes=unlocked.includes(a);return `<div class="achievement ${yes?'unlocked':'locked'}"><div class="achievement-icon">${yes?a.icon:'◌'}</div><strong>${a.title}</strong><small>${a.desc}</small></div>`}).join('')}
function renderRepos(){const sorted=[...state.repos].sort((a,b)=>(b.stargazers_count-a.stargazers_count)||(b.updated_at.localeCompare(a.updated_at)));$('#repoList').innerHTML=sorted.slice(0,12).map(r=>`<article class="repo"><div class="repo-top"><a href="${r.html_url}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a><span class="repo-meta">★ ${fmt(r.stargazers_count)}</span></div><div class="repo-desc">${escapeHtml(r.description||'No public description.')}</div><div class="repo-meta"><span><i class="language-dot"></i>${escapeHtml(r.language||'Mixed')}</span><span>⑂ ${fmt(r.forks_count)}</span><span>◷ ${new Date(r.updated_at).toLocaleDateString()}</span></div></article>`).join('')||'<div class="status-card">No public repositories found.</div>'}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function status(message,type=''){const region=$('#statusRegion');region.innerHTML=message?`<div class="status-card ${type}">${message}</div>`:''}
async function fetchJson(url){const r=await fetch(url,{headers:{Accept:'application/vnd.github+json'}});if(!r.ok){const e=new Error(r.status===403?'GitHub API rate limit reached. Please wait and try again later.':r.status===404?'GitHub username not found.':`GitHub API returned ${r.status}.`);e.status=r.status;throw e}return r.json()}
const CONTRIBUTIONS_API='https://github-contributions-api.jogruber.de/v4';
let heatmapRequestId=0;
function setHeatmapStatus(title,message,type=''){
 const box=$('#heatmapStatus');
 box.className=`heatmap-status ${type}`;
 box.innerHTML=`<span class="unavailable-icon">${type==='loading'?'◌':type==='error'?'!':'▦'}</span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div>`;
 $('#heatmapResults').classList.add('hidden');
 $('#retryHeatmapBtn').classList.toggle('hidden',type!=='error');
}
function formatDateLocal(iso){const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d,12).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});}
function renderHeatmap(payload,username){
 if(!payload||!Array.isArray(payload.contributions)||payload.contributions.length===0) throw new Error('The contribution service returned no calendar data for this profile.');
 const days=payload.contributions.filter(d=>d&&/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&Number.isFinite(Number(d.count))&&Number(d.count)>=0).map(d=>({date:d.date,count:Number(d.count),level:Number.isInteger(Number(d.level))&&Number(d.level)>=0&&Number(d.level)<=4?Number(d.level):null})).sort((a,b)=>a.date.localeCompare(b.date));
 if(!days.length) throw new Error('The contribution service response did not contain valid daily records.');
 const unique=new Map(days.map(d=>[d.date,d]));
 const clean=[...unique.values()];
 const first=clean[0],last=clean[clean.length-1];
 const startParts=first.date.split('-').map(Number),startDate=new Date(startParts[0],startParts[1]-1,startParts[2],12);
 const startOffset=(startDate.getDay()+6)%7;
 const grid=$('#heatmapGrid');grid.innerHTML='';
 const lastParts=last.date.split('-').map(Number);const lastDate=new Date(lastParts[0],lastParts[1]-1,lastParts[2],12);const daySpan=Math.round((lastDate.getTime()-startDate.getTime())/86400000)+1;grid.style.setProperty('--week-count',String(Math.ceil((startOffset+daySpan)/7)));
 clean.forEach(day=>{
   const [y,m,d]=day.date.split('-').map(Number);const date=new Date(y,m-1,d,12);
   const offset=Math.round((date.getTime()-startDate.getTime())/86400000);
   const cell=document.createElement('span');
   const fallbackLevel=day.count===0?0:day.count<3?1:day.count<6?2:day.count<10?3:4;
   const level=day.level===null?fallbackLevel:day.level;
   cell.className=`heat-cell level-${level}`;
   cell.style.gridColumn=String(Math.floor((startOffset+offset)/7)+1);
   cell.style.gridRow=String((date.getDay()+6)%7+1);
   cell.title=`${day.count} contribution${day.count===1?'':'s'} on ${day.date}`;
   cell.setAttribute('aria-label',cell.title);
   grid.appendChild(cell);
 });
 const total=clean.reduce((sum,d)=>sum+d.count,0);
 const active=clean.filter(d=>d.count>0).length;
 $('#heatmapTotal').textContent=fmt(total);
 $('#heatmapActiveDays').textContent=fmt(active);
 $('#heatmapRange').textContent=`${formatDateLocal(first.date)} – ${formatDateLocal(last.date)}`;
 $('#heatmapResults').classList.remove('hidden');
 $('#heatmapStatus').classList.add('hidden');
 $('#retryHeatmapBtn').classList.add('hidden');
 $('#loadHeatmapBtn').innerHTML='REFRESH HEATMAP <span>↻</span>';
 $('#loadHeatmapBtn').disabled=false;
 const rawLink=$('#heatmapRawLink');if(rawLink) rawLink.href=`${CONTRIBUTIONS_API}/${encodeURIComponent(username)}?y=last`;
}
async function loadHeatmap(){
 if(!state.user){setHeatmapStatus('Load a GitHub profile first','Search for a username before requesting contribution data.','error');return;}
 const username=state.user.login;const requestId=++heatmapRequestId;
 $('#loadHeatmapBtn').disabled=true;$('#retryHeatmapBtn').classList.add('hidden');
 setHeatmapStatus('Fetching contribution calendar…','Requesting daily counts from the optional community service.','loading');
 try{
   const response=await fetch(`${CONTRIBUTIONS_API}/${encodeURIComponent(username)}?y=last`,{headers:{Accept:'application/json'}});
   if(!response.ok) throw new Error(response.status===404?'The contribution service could not find this public profile.':response.status===429?'The contribution service is rate-limiting requests. Wait a little, then retry.':`The contribution service returned HTTP ${response.status}.`);
   const payload=await response.json();
   if(requestId!==heatmapRequestId||state.user?.login!==username)return;
   if(payload&&payload.error) throw new Error(String(payload.error));
   renderHeatmap(payload,username);
 }catch(error){
   if(requestId!==heatmapRequestId)return;
   setHeatmapStatus('Contribution data unavailable',`${error.message||'The external service could not be reached.'} GitHub profile and repository data are still available. No contribution values have been invented.`,'error');
 }finally{if(requestId===heatmapRequestId)$('#loadHeatmapBtn').disabled=false;}
}
$('#loadHeatmapBtn').addEventListener('click',loadHeatmap);
$('#retryHeatmapBtn').addEventListener('click',loadHeatmap);

async function loadUser(username){status('Loading public GitHub data…','loading');$('#dashboard').classList.add('hidden');heatmapRequestId++;$('#loadHeatmapBtn').innerHTML='LOAD HEATMAP <span>↗</span>';$('#loadHeatmapBtn').disabled=false;$('#heatmapStatus').classList.remove('hidden');$('#retryHeatmapBtn').classList.add('hidden');$('#heatmapResults').classList.add('hidden');setHeatmapStatus('Contribution calendar not loaded','Choose “Load Heatmap” to request real contribution data. If the service is unavailable, this panel will explain why instead of inventing values.');try{const user=await fetchJson(`${API}/users/${encodeURIComponent(username)}`);const repos=await fetchJson(`${API}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);state.user=user;state.repos=Array.isArray(repos)?repos:[];const local=loadQuests();state.quests={done:local.done,bonusXp:local.bonusXp};state.xp=xpFor(user,state.repos)+state.quests.bonusXp;renderProfile();renderLevel();renderQuests();renderAchievements();renderRepos();$('#dashboard').classList.remove('hidden');status('');history.replaceState(null,'',`#${encodeURIComponent(user.login)}`);window.scrollTo({top:document.querySelector('.dashboard').offsetTop-20,behavior:'smooth'});}catch(e){status(`${escapeHtml(e.message)} <button id="retryBtn" class="inline-retry">Retry</button>`,'error');$('#retryBtn').onclick=()=>loadUser(username)}}
function shareText(){const u=state.user;const unlocked=ACHIEVEMENTS.filter(a=>a.test(u,state.repos)).length;return `⚔️ ${u.name||u.login} — GitHub Streak RPG\nLVL ${state.level} ${levelTitle(state.level)} • ${state.xp} XP\n${u.public_repos} public repos • ${u.followers} followers • ${unlocked}/${ACHIEVEMENTS.length} achievements\ngithub.com/${u.login}`}
async function share(){const text=shareText();try{if(navigator.share){await navigator.share({title:'GitHub Streak RPG',text,url:state.user.html_url})}else{await navigator.clipboard.writeText(text);toast('Developer card copied to clipboard.')}}catch(e){if(e.name!=='AbortError')toast('Could not share. Try copying manually.')}}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2300)}
$('#searchForm').addEventListener('submit',e=>{e.preventDefault();const name=$('#username').value.trim().replace(/^@/,'');if(name)loadUser(name)});
$('#shareBtn').addEventListener('click',share);
$('#aboutBtn').onclick=()=>$('#aboutModal').classList.remove('hidden');$('#modalClose').onclick=()=>$('#aboutModal').classList.add('hidden');$('#aboutModal').addEventListener('click',e=>{if(e.target.id==='aboutModal')e.currentTarget.classList.add('hidden')});
const initial=decodeURIComponent(location.hash.slice(1));if(initial){$('#username').value=initial;loadUser(initial)}
