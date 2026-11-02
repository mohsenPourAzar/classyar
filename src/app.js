/* Classyar - Persian React gradebook with MongoDB synchronization and offline browser cache. */
(function(){
'use strict';
const e=React.createElement, L=window.ClassyarLogic, EX=window.ClassyarExport;
const nav=[['dashboard','پیشخوان','grid'],['classes','کلاس‌ها','layers'],['students','دانش‌آموزان','users'],['attendance','حضور و غیاب','calendar'],['modules','پودمان‌ها','boxes'],['assessments','آزمون و تمرین','clipboard'],['grades','لیست نمرات و خروجی','chart'],['settings','تنظیمات و پشتیبان','settings']];
const paths={grid:['rect x="3" y="3" width="7" height="7" rx="1"','rect x="14" y="3" width="7" height="7" rx="1"','rect x="3" y="14" width="7" height="7" rx="1"','rect x="14" y="14" width="7" height="7" rx="1"'],layers:['path d="m12 2 9 5-9 5-9-5 9-5Z"','path d="m3 12 9 5 9-5"','path d="m3 17 9 5 9-5"'],users:['path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"','circle cx="9" cy="7" r="4"','path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"'],calendar:['rect x="3" y="4" width="18" height="17" rx="2"','path d="M16 2v4M8 2v4M3 10h18"'],boxes:['rect x="2" y="2" width="9" height="9" rx="2"','rect x="13" y="2" width="9" height="9" rx="2"','rect x="2" y="13" width="9" height="9" rx="2"','rect x="13" y="13" width="9" height="9" rx="2"'],clipboard:['rect x="5" y="4" width="14" height="18" rx="2"','path d="M9 4.5h6M8 11h8M8 15h8"'],chart:['path d="M3 3v18h18M7 15l4-4 3 2 6-7"'],settings:['circle cx="12" cy="12" r="3"','path d="M19.4 15a1.8 1.8 0 0 0 .36 1.99l.05.05-2 2-.05-.05a1.8 1.8 0 0 0-1.99-.36 1.8 1.8 0 0 0-1.1 1.66V21h-2.9v-.72A1.8 1.8 0 0 0 10.67 18.6a1.8 1.8 0 0 0-1.99.36l-.05.05-2-2 .05-.05A1.8 1.8 0 0 0 7.04 15a1.8 1.8 0 0 0-1.66-1.1H4.7v-2.9h.68a1.8 1.8 0 0 0 1.66-1.1 1.8 1.8 0 0 0-.36-1.99l-.05-.05 2-2 .05.05a1.8 1.8 0 0 0 1.99.36 1.8 1.8 0 0 0 1.1-1.66V4h2.9v.68a1.8 1.8 0 0 0 1.1 1.66 1.8 1.8 0 0 0 1.99-.36l.05-.05 2 2-.05.05a1.8 1.8 0 0 0-.36 1.99 1.8 1.8 0 0 0 1.66 1.1h.68v2.9h-.68a1.8 1.8 0 0 0-1.66 1.1Z"'],plus:['path d="M12 5v14M5 12h14"'],search:['circle cx="11" cy="11" r="7"','path d="m16 16 5 5"'],trash:['path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15M10 10v7M14 10v7"'],edit:['path d="M12 20h9M16.5 3.5l4 4L9 19l-5 1 1-5 11.5-11.5Z"'],download:['path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"'],upload:['path d="M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4"'],close:['path d="M5 5l14 14M19 5 5 19"'],check:['path d="m4 12 5 5L20 6"'],alert:['path d="M12 3 2 21h20L12 3Z"','path d="M12 9v5M12 18h.01"'],more:['circle cx="5" cy="12" r="1"','circle cx="12" cy="12" r="1"','circle cx="19" cy="12" r="1"'],sun:['circle cx="12" cy="12" r="4"','path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"'],moon:['path d="M20.9 13.35A9 9 0 0 1 10.65 3.1 9 9 0 1 0 20.9 13.35Z"'],print:['path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z"'],menu:['path d="M4 6h16M4 12h16M4 18h16"'],arrow:['path d="m15 18-6-6 6-6"'],school:['path d="M3 21V6l9-4 9 4v15M8 21v-7h8v7M7 9h.01M12 9h.01M17 9h.01"'],target:['circle cx="12" cy="12" r="9"','circle cx="12" cy="12" r="5"','circle cx="12" cy="12" r="1"'],clock:['circle cx="12" cy="12" r="9"','path d="M12 7v5l4 2"'],info:['circle cx="12" cy="12" r="10"','path d="M12 11v6M12 7h.01"'],save:['path d="M5 3h13l3 3v15H3V3h2M7 3v6h10V3M7 21v-8h10v8"']};
function Icon(props){const p=paths[props.name]||paths.grid;return e('svg',{width:props.size||20,height:props.size||20,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.85,strokeLinecap:'round',strokeLinejoin:'round',className:props.className||'', 'aria-hidden':'true'},p.map((line,i)=>{const tag=line.startsWith('circle')?'circle':line.startsWith('rect')?'rect':'path';const attrs={key:i};(line.match(/([\w-]+)="([^"]*)"/g)||[]).forEach(a=>{const m=a.match(/([\w-]+)="([^"]*)"/);attrs[m[1]==='class'?'className':m[1]]=m[2]});return e(tag,attrs)}));}
const cn=(...a)=>a.filter(Boolean).join(' ');
const fmt=n=>new Intl.NumberFormat('fa-IR',{maximumFractionDigits:2}).format(n);
const dateNow=()=>new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const makeId=()=>globalThis.crypto && globalThis.crypto.randomUUID ? globalThis.crypto.randomUUID() : ('id-'+Date.now()+'-'+Math.random().toString(36).slice(2,10));
const button=(label,icon,fn,variant='soft',extras={})=>e('button',{type:'button',onClick:fn,className:cn('btn',variant==='primary'?'btn-primary':variant==='ghost'?'btn-ghost':variant==='danger'?'btn-danger':variant==='white'?'btn-white':variant==='outline-white'?'btn-outline-white':'btn-soft',extras.className),title:extras.title,disabled:extras.disabled},icon?e(Icon,{name:icon,size:17}):null,label);
const iconButton=(icon,fn,title,variant='ghost')=>e('button',{type:'button',className:cn('icon-btn',variant==='danger'?'icon-danger':''),onClick:fn,title,'aria-label':title},e(Icon,{name:icon,size:17}));
const badge=(text,kind='muted')=>e('span',{className:'badge badge-'+kind},text);
const panel=(title,subtitle,actions,content,cls='')=>e('section',{className:cn('panel',cls)},e('div',{className:'panel-head'},e('div',null,e('h3',null,title),subtitle?e('p',null,subtitle):null),actions),content);
function downloadBinary(bytes,filename,mime){const blob=new Blob([bytes],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),900);}
function downloadText(text,filename,mime){const blob=new Blob([text],{type:mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);}
function Empty(props){return e('div',{className:'empty'},e('div',{className:'empty-illustration'},e(Icon,{name:props.icon||'boxes',size:32})),e('h3',null,props.title),e('p',null,props.description||'هنوز اطلاعاتی برای نمایش ثبت نشده است.'),props.action||null);}
function FormInput(p){return e('label',{className:'field'},e('span',{className:'field-label'},p.label,p.required?e('em',null,' *'):null),p.kind==='textarea'?e('textarea',{name:p.name,defaultValue:p.value||'',placeholder:p.placeholder||'',rows:p.rows||3,required:p.required||false}):p.kind==='select'?e('select',{name:p.name,defaultValue:p.value||'',required:p.required||false},(p.options||[]).map(x=>e('option',{key:x.value,value:x.value},x.label))):e('input',{name:p.name,type:p.kind||'text',defaultValue:p.value==null?'':p.value,required:p.required||false,min:p.min,max:p.max,step:p.step,placeholder:p.placeholder||''}),p.hint?e('small',null,p.hint):null);}
function Stat(props){return e('div',{className:'stat-card'},e('div',{className:cn('stat-icon','stat-'+props.tint)},e(Icon,{name:props.icon,size:23})),e('div',null,e('div',{className:'stat-label'},props.title),e('div',{className:'stat-value'},fmt(props.value)),props.suffix?e('div',{className:'stat-suffix'},props.suffix):null));}
function makeDefaultComponents(db,moduleId){for(const [tag,name,weight] of [['exam','آزمون پودمان',15],['exercise','تمرین‌ها',4],['attendance','حضور و غیاب',1]])db.components.push({id:makeId(),moduleId,name,weight,kind:tag==='attendance'?'attendance':'assessment',tag});}
const statuses=[['present','حاضر','حاضر'],['absent','غایب','غایب'],['late','تأخیر','تأخیر'],['excused','موجه','موجه']];
class App extends React.Component {
  constructor(props){super(props);
    let db=window.CLASSYAR_SEED;
    try{const saved=JSON.parse(localStorage.getItem('classyar-data-v1')||'null');if(L.validateDatabase(saved))db=L.normalizedDatabase(saved);}catch{}
    const {theme,font}=window.ClassyarPreferences.read();
    this.state={db,theme,font,gradeScope:'module',view:'dashboard',classId:db.classes[0]?db.classes[0].id:null,moduleId:null,sessionId:null,assessmentId:null,modal:null,search:'',mobileMenu:false,saveStatus:'آماده',notification:null,ready:false};
    this.timer=null;this.notificationTimer=null;this.retryTimer=null;this.saving=false;this.syncBlocked=false;this.lastSavedData=null;this.serverRevision=null;this.pendingChanges=false;
    try{const sync=JSON.parse(localStorage.getItem('classyar-sync-v2')||'null');if(sync){this.serverRevision=Number.isSafeInteger(sync.revision)?sync.revision:null;this.pendingChanges=sync.pending===true;}}catch{}
  }
  componentDidMount(){
    window.ClassyarPreferences.apply(this.state);
    if(location.protocol==='http:'||location.protocol==='https:'){
      this.connectServer();
    }else this.setState({ready:true,saveStatus:'حالت آفلاین'});
  }
  componentDidUpdate(prevProps,prevState){
    if(prevState.theme!==this.state.theme||prevState.font!==this.state.font){
      window.ClassyarPreferences.apply(this.state);
      try{localStorage.setItem('classyar-theme-v2',this.state.theme);localStorage.setItem('classyar-font-v2',this.state.font);}catch{}
    }
    if(prevState.db!==this.state.db){
      const snapshot=JSON.stringify(this.state.db);
      try{localStorage.setItem('classyar-data-v1',snapshot);}catch{this.notify('فضای ذخیره مرورگر کافی نیست؛ نسخه پشتیبان بگیرید.');}
      if(snapshot!==this.lastSavedData){
        this.pendingChanges=true;this.rememberSync();
        if(this.state.ready&&(location.protocol==='http:'||location.protocol==='https:')){
          if(!this.syncBlocked)this.setState({saveStatus:'در انتظار ذخیره در MongoDB'});
          clearTimeout(this.timer);this.timer=setTimeout(()=>this.saveToServer(),600);
        }
      }
    }
  }
  componentWillUnmount(){clearTimeout(this.timer);clearTimeout(this.notificationTimer);clearTimeout(this.retryTimer);}
  rememberSync(){try{localStorage.setItem('classyar-sync-v2',JSON.stringify({revision:this.serverRevision,pending:this.pendingChanges}));}catch{}}
  conflict(){
    this.syncBlocked=true;clearTimeout(this.retryTimer);
    this.setState({ready:true,saveStatus:'تداخل تغییرات؛ پشتیبان بگیرید'});
    this.notify('اطلاعات سرور تغییر کرده است. ابتدا نسخه پشتیبان تغییرات این دستگاه را بگیرید و سپس نسخه سرور را دریافت کنید.');
  }
  resolveConflict(){
    this.exportBackup();
    this.pendingChanges=false;this.syncBlocked=false;this.rememberSync();this.connectServer();
  }
  async connectServer(){
    try{
      const response=await fetch('/api/state',{signal:AbortSignal.timeout(8000)});
      if(!response.ok)throw new Error();
      const saved=await response.json();
      if(!L.validateDatabase(saved)||!Number.isSafeInteger(saved.revision))throw new Error();
      if(this.pendingChanges){
        if(this.serverRevision!==saved.revision){this.conflict();return;}
        this.setState({ready:true},()=>this.saveToServer());return;
      }
      const db=L.normalizedDatabase(saved);
      this.serverRevision=saved.revision;this.lastSavedData=JSON.stringify(db);this.rememberSync();
      this.setState(s=>({db,classId:s.classId&&saved.classes.some(c=>c.id===s.classId)?s.classId:(saved.classes[0]||{}).id||null,ready:true,saveStatus:'متصل به MongoDB'}));
    }catch{
      this.setState({ready:true,saveStatus:'آفلاین؛ فقط در این مرورگر'});
      clearTimeout(this.retryTimer);this.retryTimer=setTimeout(()=>this.connectServer(),5000);
    }
  }
  async saveToServer(){
    if(this.saving||this.syncBlocked||!this.pendingChanges)return;
    if(this.serverRevision===null){this.connectServer();return;}
    this.saving=true;
    const snapshot=JSON.stringify(this.state.db);
    try{
      const response=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json','If-Match':'"'+this.serverRevision+'"'},body:snapshot,signal:AbortSignal.timeout(8000)});
      if(response.status===409){this.conflict();return;}
      if(response.status===400||response.status===413){this.syncBlocked=true;this.setState({saveStatus:'ذخیره نشد؛ داده نامعتبر یا بیش از حد مجاز'});this.notify('MongoDB تغییرات را نپذیرفت؛ برای حفظ اطلاعات نسخه پشتیبان بگیرید.');return;}
      if(!response.ok)throw new Error();
      const result=await response.json();
      if(!Number.isSafeInteger(result.revision))throw new Error();
      this.serverRevision=result.revision;this.lastSavedData=snapshot;this.pendingChanges=JSON.stringify(this.state.db)!==snapshot;this.rememberSync();
      clearTimeout(this.retryTimer);
      this.setState({saveStatus:this.pendingChanges?'در انتظار ذخیره در MongoDB':'در MongoDB ذخیره شد'});
      if(this.pendingChanges){clearTimeout(this.timer);this.timer=setTimeout(()=>this.saveToServer(),100);}
    }catch{
      this.setState({saveStatus:'آفلاین؛ فقط در این مرورگر'});
      clearTimeout(this.retryTimer);this.retryTimer=setTimeout(()=>this.saveToServer(),5000);
    }finally{this.saving=false;}
  }
  notify(message){this.setState({notification:message});clearTimeout(this.notificationTimer);this.notificationTimer=setTimeout(()=>this.setState({notification:null}),3500);}
  write(fn){this.setState(s=>{const db=JSON.parse(JSON.stringify(s.db));fn(db);return {db};});}
  get selectedClass(){return this.state.db.classes.find(c=>c.id===this.state.classId)||null;}
  get students(){return this.state.db.students.filter(s=>s.classId===this.state.classId);}
  get modules(){return this.state.db.modules.filter(m=>m.classId===this.state.classId).sort((a,b)=>a.order-b.order);}
  get currentModule(){return this.modules.find(m=>m.id===this.state.moduleId)||this.modules[0]||null;}
  get classSessions(){return this.state.db.sessions.filter(s=>s.classId===this.state.classId).sort((a,b)=>Number(b.order||0)-Number(a.order||0));}
  changeClass(id){this.setState({classId:id,moduleId:null,sessionId:null,assessmentId:null,search:'',view:'dashboard',mobileMenu:false});}
  go(view){this.setState({view,search:'',mobileMenu:false});}
  renderFontSettings(){
    return panel('قلم نوشته‌ها','قلم دلخواه را برای تمام صفحه‌ها انتخاب کنید.',null,
      e('div',{className:'font-settings'},e('fieldset',{className:'font-options'},e('legend',{className:'sr-only'},'قلم نوشته‌ها'),
        [['vazirmatn','وزیرمتن','Vazirmatn (Vazir)'],['iran-sans','ایران‌سنس','Iran Sans'],['parastoo','پرستو','Parastoo']].map(([value,label,english])=>
          e('label',{key:value,className:'font-option',style:{fontFamily:'var(--font-'+value+')'}},
            e('input',{type:'radio',name:'app-font',value,checked:this.state.font===value,onChange:()=>this.setState({font:value})}),
            e('span',null,e('strong',null,label),e('small',{lang:'en',dir:'ltr'},english))))),
        e('p',{className:'font-note'},'وزیرمتن و پرستو آفلاین در دسترس‌اند. ایران‌سنس به نسخه نصب‌شده روی دستگاه یا فایل قلم نیاز دارد.')));
  }
  renderThemeSelector(name){
    return e('fieldset',{className:'theme-selector','data-selected':this.state.theme},e('legend',{className:'sr-only'},'حالت نمایش'),
      e('span',{className:'theme-thumb','aria-hidden':'true'}),
      [['light','روشن','sun'],['dark','تیره','moon']].map(([value,label,icon])=>
        e('label',{key:value,className:'theme-option',title:'حالت '+label},
          e('input',{type:'radio',name,value,checked:this.state.theme===value,onChange:()=>this.setState({theme:value})}),
          e('span',{className:'theme-option-content'},e(Icon,{name:icon,size:20}),e('span',{className:'sr-only'},label)))));
  }
  open(type,item=null){this.setState({modal:{type,item},mobileMenu:false});}
  close(){this.setState({modal:null});}
  remove(type,item){
    const names={class:'کلاس',student:'دانش‌آموز',module:'پودمان',component:'بخش نمره‌دهی',session:'جلسه',assessment:'آیتم ارزشیابی'};
    if(!confirm(`«${item.name||item.title}» حذف شود؟ اطلاعات وابسته به ${names[type]} نیز حذف خواهد شد.`))return;
    this.write(db=>{
      const removeStudents=new Set(),removeModules=new Set(),removeComponents=new Set(),removeSessions=new Set(),removeAssessments=new Set();
      if(type==='class') {db.classes=db.classes.filter(x=>x.id!==item.id);db.students.filter(x=>x.classId===item.id).forEach(x=>removeStudents.add(x.id));db.modules.filter(x=>x.classId===item.id).forEach(x=>removeModules.add(x.id));db.sessions.filter(x=>x.classId===item.id).forEach(x=>removeSessions.add(x.id));}
      if(type==='student'){removeStudents.add(item.id);}
      if(type==='module'){removeModules.add(item.id);}
      if(type==='component'){removeComponents.add(item.id);}
      if(type==='session'){removeSessions.add(item.id);}
      if(type==='assessment'){removeAssessments.add(item.id);}
      db.modules.filter(x=>removeModules.has(x.id)).forEach(x=>{db.sessions.filter(s=>s.moduleId===x.id).forEach(s=>removeSessions.add(s.id));db.components.filter(c=>c.moduleId===x.id).forEach(c=>removeComponents.add(c.id));});
      db.assessments.filter(a=>removeComponents.has(a.componentId)).forEach(a=>removeAssessments.add(a.id));
      db.students=db.students.filter(x=>!removeStudents.has(x.id));db.modules=db.modules.filter(x=>!removeModules.has(x.id));db.components=db.components.filter(x=>!removeComponents.has(x.id));db.sessions=db.sessions.filter(x=>!removeSessions.has(x.id));db.assessments=db.assessments.filter(x=>!removeAssessments.has(x.id));db.attendance=db.attendance.filter(x=>!removeStudents.has(x.studentId)&&!removeSessions.has(x.sessionId));db.marks=db.marks.filter(x=>!removeStudents.has(x.studentId)&&!removeAssessments.has(x.assessmentId));
    });
    if(type==='class')this.setState(s=>({classId:s.db.classes.find(c=>c.id!==item.id)?.id||null,view:'classes'}));
    if(type==='module')this.setState({moduleId:null});if(type==='session')this.setState({sessionId:null});if(type==='assessment')this.setState({assessmentId:null});
    this.notify('مورد انتخاب‌شده حذف شد.');
  }
  setAttendance(sessionId,studentId,status){this.write(db=>{db.attendance=db.attendance.filter(x=>!(x.sessionId===sessionId&&x.studentId===studentId));if(status!=='unset')db.attendance.push({sessionId,studentId,status});});}
  markAllPresent(sessionId){this.write(db=>{this.students.forEach(s=>{if(!db.attendance.some(x=>x.studentId===s.id&&x.sessionId===sessionId))db.attendance.push({sessionId,studentId:s.id,status:'present'});});});this.notify('دانش‌آموزان بدون وضعیت، حاضر ثبت شدند.');}
  setMark(aid,studentId,raw,max){if(raw!=='' && (!Number.isFinite(Number(raw))||Number(raw)<0||Number(raw)>Number(max)))return;
    this.write(db=>{db.marks=db.marks.filter(x=>!(x.assessmentId===aid&&x.studentId===studentId));if(raw!=='')db.marks.push({assessmentId:aid,studentId,score:Number(raw)});});
  }
  saveModal(ev){ev.preventDefault();const m=this.state.modal;if(!m)return;const form=new FormData(ev.currentTarget);const v=Object.fromEntries(form.entries());const old=m.item;const id=old?.id||makeId();const classId=this.state.classId, module=this.currentModule;
    if(m.type==='component' && Number(v.weight)<0){this.notify('وزن نباید منفی باشد.');return;}
    if(m.type==='assessment' && (!(Number(v.maxScore)>0))){this.notify('بارم باید بزرگ‌تر از صفر باشد.');return;}
    this.write(db=>{
      const put=(table,item)=>{const idx=db[table].findIndex(x=>x.id===id);if(idx>=0)db[table][idx]={...db[table][idx],...item};else db[table].push(item);};
      if(m.type==='class'){put('classes',{id,name:v.name.trim(),grade:v.grade,subject:v.subject.trim(),year:v.year.trim(),color:v.color});if(!old){const newModule=makeId();db.modules.push({id:newModule,classId:id,name:'پودمان اول',description:'قابل ویرایش و توسعه',order:1});makeDefaultComponents(db,newModule);}}
      if(m.type==='student')put('students',{id,classId,name:v.name.trim(),studentCode:v.studentCode.trim(),note:v.note.trim()});
      if(m.type==='module'){put('modules',{id,classId,name:v.name.trim(),description:v.description.trim(),order:Number(v.order)||1});if(!old)makeDefaultComponents(db,id);}
      if(m.type==='component')put('components',{id,moduleId:module.id,name:v.name.trim(),kind:v.kind,weight:Number(v.weight),tag:old?.tag||'custom'});
      if(m.type==='session')put('sessions',{id,classId,moduleId:v.moduleId,title:v.title.trim(),date:v.date.trim(),order:old?.order||(Math.max(0,...db.sessions.filter(s=>s.classId===classId).map(s=>Number(s.order||0)))+1)});
      if(m.type==='assessment')put('assessments',{id,moduleId:module.id,componentId:v.componentId,title:v.title.trim(),date:v.date.trim(),maxScore:Number(v.maxScore)});
      if(m.type==='bulk')v.names.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).forEach(name=>db.students.push({id:makeId(),classId,name,studentCode:'',note:''}));
    });
    if(m.type==='class'&&!old)this.setState({classId:id});
    if(m.type==='module')this.setState({moduleId:id});
    if(m.type==='session')this.setState({sessionId:id});
    if(m.type==='assessment')this.setState({assessmentId:id});
    this.close();this.notify(old?'تغییرات ذخیره شد.':'مورد جدید با موفقیت ثبت شد.');
  }
  exportBackup(){downloadText(JSON.stringify(this.state.db,null,2),`classyar-backup-${new Date().toISOString().slice(0,10)}.json`,'application/json;charset=utf-8');this.notify('نسخه پشتیبان دریافت شد.');}
  importBackup(ev){const f=ev.target.files?.[0];if(!f)return;const reader=new FileReader();reader.onload=()=>{try{const incoming=JSON.parse(reader.result);if(!L.validateDatabase(incoming))throw Error('ساختار فایل نامعتبر است');if(!confirm('اطلاعات فعلی با محتوای این نسخه پشتیبان جایگزین شود؟ ابتدا از داده‌های فعلی فایل پشتیبان بگیرید.'))return;this.setState({db:L.normalizedDatabase(incoming),classId:incoming.classes[0]?.id||null,moduleId:null,sessionId:null,assessmentId:null,view:'dashboard'});this.notify('نسخه پشتیبان بازیابی شد.');}catch{this.notify('فایل انتخاب‌شده معتبر نیست.');}};reader.readAsText(f);ev.target.value='';}
  get reportScope(){return this.state.gradeScope==='all'?'all':(this.currentModule?.id||'all');}
  exportGradeList(format='xlsx'){
    if(!this.selectedClass)return;
    try{
      const scope=this.reportScope;
      const report=EX.listRows(this.state.db,this.state.classId,scope);
      const safe=(this.selectedClass.name+'-'+(scope==='all'?'تمام-پودمان‌ها':this.currentModule.name)).replace(/[\\/:*?"<>|]/g,'-');
      if(format==='xlsx')downloadBinary(EX.makeXLSX(this.state.db,this.state.classId,scope),`لیست-نمرات-${safe}.xlsx`,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      else downloadText(EX.makeCSV(report),`لیست-نمرات-${safe}.csv`,'text/csv;charset=utf-8');
      this.notify(format==='xlsx'?'فایل اکسل لیست نمرات آماده شد.':'فایل CSV لیست نمرات آماده شد.');
    }catch(err){this.notify('خطا در خروجی: '+err.message);}
  }
  printGradeList(){window.print();}
  renderHeader(){
    const selected=this.selectedClass, pageTitle=(nav.find(n=>n[0]===this.state.view)||nav[0])[1];
    return e('header',{className:'topbar'},
      e('div',{className:'topbar-right'},iconButton('menu',()=>this.setState(s=>({mobileMenu:!s.mobileMenu})),'بازکردن فهرست'),
        e('div',null,e('div',{className:'crumbs'},'فضای کاری دبیر',e(Icon,{name:'arrow',size:13}),selected?selected.name:'مدیریت کلاس'),e('h1',null,pageTitle))),
      e('div',{className:'topbar-left'},
        e('span',{className:'today'},e(Icon,{name:'calendar',size:16}),dateNow()),
        e('span',{className:'connection'},e('i',{className:cn('connection-dot',!this.state.saveStatus.includes('MongoDB')&&'connection-offline')}),this.state.saveStatus),
        this.renderThemeSelector('header-theme'),
        e('div',{className:'avatar'},'د')));
  }
  renderSidebar(){
    const groups=[['نمای کلی',['dashboard','classes']],['مدیریت کلاس',['students','attendance']],['ارزشیابی و گزارش',['modules','assessments','grades']],['سامانه',['settings']]];
    return e('div',null,this.state.mobileMenu?e('div',{className:'overlay-nav',onClick:()=>this.setState({mobileMenu:false})}):null,
      e('aside',{className:cn('sidebar',this.state.mobileMenu&&'sidebar-open')},
        e('div',{className:'brand'},e('div',{className:'brand-mark'},e(Icon,{name:'school',size:26})),e('div',null,e('strong',null,'کلاس‌یار'),e('span',null,'فضای مدیریت آموزشی'))),
        e('nav',{className:'nav','aria-label':'منوی اصلی'},groups.map(([label,keys])=>
          e('div',{className:'nav-group',key:label},e('div',{className:'side-title'},label),keys.map(key=>{
            const [,,ico]=nav.find(n=>n[0]===key),text=nav.find(n=>n[0]===key)[1];
            return e('button',{key,type:'button',onClick:()=>this.go(key),className:cn('nav-item',this.state.view===key&&'nav-active'),'aria-current':this.state.view===key?'page':undefined},e(Icon,{name:ico,size:19}),e('span',null,text),this.state.view===key?e('i',{className:'nav-indicator'}):null);
          })))),
        e('div',{className:'side-footer'},e('div',{className:'side-footer-icon'},e(Icon,{name:'info',size:18})),e('div',null,e('strong',null,'نسخه ۲ · آفلاین و محلی'),e('span',null,'کلاس‌ها، گزارش‌ها و نمرات')))));
  }
  renderClassSwitcher(){return e('div',{className:'class-switch'},e('div',{className:'class-switch-label'},e(Icon,{name:'school',size:17}),'کلاس فعال'),e('div',{className:'class-switch-actions'},e('select',{value:this.state.classId||'',onChange:ev=>this.changeClass(ev.target.value)},this.state.db.classes.map(c=>e('option',{key:c.id,value:c.id},c.name)),this.state.db.classes.length===0?e('option',{value:''},'ابتدا کلاس بسازید'):null),iconButton('plus',()=>this.open('class'),'تعریف کلاس جدید')));}
  renderDashboard(){const db=this.state.db,cl=this.selectedClass;const stats=L.attendanceStats(db,this.state.classId);const as=db.assessments.filter(a=>a.moduleId && this.modules.some(m=>m.id===a.moduleId));const count=this.students.length;return e('div',{className:'stack'},e('div',{className:'hero'},e('div',{className:'hero-pattern'}),e('div',{className:'hero-content'},e('div',{className:'hero-label'},'پنل مدیریت مدرسه'),e('h2',null,'مدیریت کلاس‌ها،',e('br'),e('span',null,'دقیق‌تر از همیشه.')),e('p',null,'حضور و غیاب، تمرین‌ها، آزمون‌ها و نمرات پودمانی را در یک محیط یکپارچه ثبت کنید.'),e('div',{className:'hero-actions'},button('ثبت جلسه جدید','plus',()=>this.open('session'),'white'),button('مشاهده کارنامه','chart',()=>this.go('grades'),'outline-white'))),e('div',{className:'hero-symbol'},e(Icon,{name:'school',size:130}))),e('div',{className:'stats-grid'},e(Stat,{title:'کلاس‌های تعریف‌شده',value:db.classes.length,icon:'layers',tint:'indigo',suffix:'قابل مدیریت'}),e(Stat,{title:'دانش‌آموزان این کلاس',value:count,icon:'users',tint:'violet',suffix:cl?cl.name:'بدون کلاس'}),e(Stat,{title:'جلسات ثبت‌شده',value:stats.sessions,icon:'calendar',tint:'teal',suffix:'در کلاس فعال'}),e(Stat,{title:'آیتم‌های ارزشیابی',value:as.length,icon:'clipboard',tint:'orange',suffix:'آزمون، تمرین و سایر موارد'})),e('div',{className:'dashboard-grid'},panel('پودمان‌های کلاس','پیشرفت و تنظیمات ارزشیابی',button('مدیریت پودمان','arrow',()=>this.go('modules'),'ghost'),this.modules.length?e('div',{className:'module-quick-list'},this.modules.map(m=>{const comps=db.components.filter(c=>c.moduleId===m.id);const val=L.moduleWeight(db,m.id);return e('button',{key:m.id,className:'module-quick',onClick:()=>{this.setState({moduleId:m.id});this.go('grades');}},e('div',{className:'module-quick-symbol'},e(Icon,{name:'boxes',size:20})),e('div',{className:'grow'},e('strong',null,m.name),e('span',null,comps.length+' بخش نمره‌دهی')),badge('سقف '+fmt(val)+' از ۲۰',Math.abs(val-20)<.001?'success':'warning'),e(Icon,{name:'arrow',size:17}));})):e(Empty,{title:'هنوز پودمانی تعریف نشده',action:button('ساخت پودمان','plus',()=>this.open('module'),'primary')})),panel('دسترسی سریع','کارهای روزمره را از اینجا انجام دهید',null,e('div',{className:'quick-actions'},[['users','افزودن دانش‌آموز','ثبت نام جدید',()=>this.open('student')],['calendar','ثبت حضور و غیاب','جلسه و وضعیت حضور',()=>this.go('attendance')],['clipboard','ثبت نمره','آزمون یا تمرین',()=>this.go('assessments')],['download','تهیه پشتیبان','دریافت فایل اطلاعات',()=>this.exportBackup()]].map((x,i)=>e('button',{key:i,className:'quick-action',onClick:x[3]},e('div',{className:'quick-icon'},e(Icon,{name:x[0],size:21})),e('div',null,e('strong',null,x[1]),e('span',null,x[2])),e(Icon,{name:'arrow',size:16})))))));
  }
  renderClasses(){return e('div',{className:'stack'},e('div',{className:'section-actions'},e('div',null,e('h2',null,'کلاس‌های من'),e('p',null,'برای هر پایه یا درس، کلاس مستقلی تعریف کنید.')),button('کلاس جدید','plus',()=>this.open('class'),'primary')),this.state.db.classes.length?e('div',{className:'class-grid'},this.state.db.classes.map(c=>e('article',{className:cn('class-card',c.id===this.state.classId&&'class-current'),key:c.id},e('div',{className:'class-card-top'},e('div',{className:'class-card-icon',style:{background:c.color+'1a',color:c.color}},e(Icon,{name:'school',size:27})),badge('پایه '+c.grade,'muted')),e('h3',null,c.name),e('p',null,c.subject||'درس تعریف نشده'),e('div',{className:'class-stat-line'},e('span',null,e(Icon,{name:'users',size:15}),fmt(this.state.db.students.filter(s=>s.classId===c.id).length)+' دانش‌آموز'),e('span',null,e(Icon,{name:'boxes',size:15}),fmt(this.state.db.modules.filter(m=>m.classId===c.id).length)+' پودمان')),e('div',{className:'class-card-footer'},button(c.id===this.state.classId?'کلاس فعال':'ورود به کلاس','arrow',()=>this.changeClass(c.id),c.id===this.state.classId?'soft':'primary'),iconButton('edit',()=>this.open('class',c),'ویرایش کلاس'),iconButton('trash',()=>this.remove('class',c),'حذف کلاس','danger'))))):e(Empty,{title:'هنوز کلاسی ندارید',description:'اولین کلاس را برای شروع تعریف کنید.',action:button('ساخت اولین کلاس','plus',()=>this.open('class'),'primary')}));}
  renderStudents(){const data=this.students.filter(s=>(s.name+' '+(s.studentCode||'')).includes(this.state.search.trim()));return e('div',{className:'stack'},e('div',{className:'section-actions'},e('div',null,e('h2',null,'دانش‌آموزان'),e('p',null,fmt(this.students.length)+' دانش‌آموز در '+(this.selectedClass?.name||'کلاس'))),e('div',{className:'toolbar-actions'},button('افزودن گروهی','upload',()=>this.open('bulk')),button('افزودن دانش‌آموز','plus',()=>this.open('student'),'primary'))),panel('فهرست دانش‌آموزان',null,e('div',{className:'search-field'},e(Icon,{name:'search',size:18}),e('input',{type:'search',value:this.state.search,placeholder:'جست‌وجوی نام یا کد...',onChange:ev=>this.setState({search:ev.target.value})})),data.length?e('div',{className:'table-scroll'},e('table',{className:'data-table'},e('thead',null,e('tr',null,e('th',null,'ردیف'),e('th',null,'نام و نام خانوادگی'),e('th',null,'کد دانش‌آموزی'),e('th',null,'توضیحات'),e('th',null,'عملیات'))),e('tbody',null,data.map((s,i)=>e('tr',{key:s.id},e('td',{className:'number'},fmt(i+1)),e('td',null,e('div',{className:'student-cell'},e('span',{className:'student-avatar'},s.name.slice(0,1)),e('strong',null,s.name))),e('td',null,s.studentCode||'—'),e('td',null,s.note?badge(s.note,'warning'):'—'),e('td',null,e('div',{className:'cell-actions'},iconButton('edit',()=>this.open('student',s),'ویرایش دانش‌آموز'),iconButton('trash',()=>this.remove('student',s),'حذف دانش‌آموز','danger')))))))):e(Empty,{title:this.state.search?'نتیجه‌ای پیدا نشد':'لیست دانش‌آموزان خالی است',action:!this.state.search?button('افزودن دانش‌آموز','plus',()=>this.open('student'),'primary'):null}),'table-panel'));
  }
  renderAttendance(){
    const sessions=this.classSessions;
    const active=sessions.find(s=>s.id===this.state.sessionId)||sessions[0];
    const db=this.state.db;
    const records=active?db.attendance.filter(r=>r.sessionId===active.id):[];
    const count=status=>records.filter(r=>r.status===status).length;
    const heading=e('div',{className:'section-actions'},
      e('div',null,e('h2',null,'ثبت حضور و غیاب'),e('p',null,'برای هر جلسه، تاریخ و پودمان را مشخص کنید.')),
      button('جلسه جدید','plus',()=>this.open('session'),'primary',{disabled:!this.modules.length})
    );
    if(!sessions.length)return e('div',{className:'stack'},heading,
      e(Empty,{title:'هنوز جلسه‌ای ثبت نکرده‌اید',description:'جلسه جدید تعریف کنید و آن را به پودمان مربوط وصل کنید.',action:button('تعریف جلسه','plus',()=>this.open('session'),'primary',{disabled:!this.modules.length})}));
    const tabs=e('div',{className:'session-strip'},sessions.map(s=>e('button',{key:s.id,className:cn('session-tab',active.id===s.id&&'session-tab-active'),onClick:()=>this.setState({sessionId:s.id})},e('strong',null,s.title||'جلسه '+fmt(s.order)),e('span',null,s.date||'بدون تاریخ'))));
    const summary=e('div',{className:'attendance-summary'},
      [['present','حاضر','success'],['absent','غایب','danger'],['late','تأخیر','warning'],['excused','موجه','muted']].map(x=>e('div',{key:x[0],className:'mini-stat'},badge(x[1],x[2]),e('strong',null,fmt(count(x[0]))))),
      e('div',{className:'mini-stat'},badge('ثبت‌نشده'),e('strong',null,fmt(Math.max(0,this.students.length-records.length))))
    );
    const rows=this.students.map((s,i)=>{
      const st=records.find(r=>r.studentId===s.id)?.status||'unset';
      const choices=statuses.map(([value,label])=>e('button',{key:value,className:cn('status-btn','status-'+value,st===value&&'status-selected'),onClick:()=>this.setAttendance(active.id,s.id,st===value?'unset':value)},label));
      return e('tr',{key:s.id},e('td',{className:'number'},fmt(i+1)),e('td',null,e('strong',null,s.name)),e('td',null,e('div',{className:'status-options'},choices,st==='unset'?badge('ثبت نشده','muted'):null)));
    });
    const table=e('div',{className:'table-scroll'},e('table',{className:'data-table'},e('thead',null,e('tr',null,e('th',null,'#'),e('th',null,'دانش‌آموز'),e('th',null,'وضعیت حضور'))),e('tbody',null,rows)));
    const actions=e('div',{className:'toolbar-actions'},button('ثبت حضور برای موارد خالی','check',()=>this.markAllPresent(active.id)),iconButton('edit',()=>this.open('session',active),'ویرایش جلسه'),iconButton('trash',()=>this.remove('session',active),'حذف جلسه','danger'));
    return e('div',{className:'stack'},heading,tabs,panel(active.title,`${active.date||'تاریخ نامشخص'} · ${db.modules.find(m=>m.id===active.moduleId)?.name||'بدون پودمان'}`,actions,e('div',null,summary,table),'table-panel'));
  }
  renderModules(){const db=this.state.db;return e('div',{className:'stack'},e('div',{className:'section-actions'},e('div',null,e('h2',null,'ساختار پودمان‌ها'),e('p',null,'تعداد پودمان‌ها، بخش‌ها و وزن‌ها کاملاً قابل تغییر است.')),button('پودمان جدید','plus',()=>this.open('module'),'primary')),this.modules.length?e('div',{className:'module-grid'},this.modules.map(m=>{const comps=db.components.filter(c=>c.moduleId===m.id),weight=L.moduleWeight(db,m.id);return e('article',{className:'panel module-card',key:m.id},e('div',{className:'module-card-header'},e('div',{className:'module-number'},fmt(m.order)),e('div',{className:'grow'},e('h3',null,m.name),e('p',null,m.description||'ساختار قابل تنظیم')),e('div',{className:'cell-actions'},iconButton('edit',()=>this.open('module',m),'ویرایش پودمان'),iconButton('trash',()=>this.remove('module',m),'حذف پودمان','danger'))),e('div',{className:'weight-section'},e('div',{className:'weight-top'},e('strong',null,'توزیع بارم'),badge(fmt(weight)+' از ۲۰',Math.abs(weight-20)<.001?'success':'warning')),e('div',{className:'weight-track'},comps.map(c=>e('span',{key:c.id,style:{width:Math.min(100,(c.weight/20)*100)+'%',background:c.kind==='attendance'?'#f5ad55':c.tag==='exam'?'#6474ef':c.tag==='exercise'?'#24a99e':'#b48aef'}}))),Math.abs(weight-20)>.001?e('p',{className:'weight-warning'},e(Icon,{name:'alert',size:15}),'برای محاسبه نهایی، مجموع وزن بخش‌ها باید ۲۰ باشد.'):null),e('div',{className:'component-list'},comps.map(c=>e('div',{key:c.id,className:'component-row'},e('div',{className:cn('component-dot',c.kind==='attendance'&&'component-dot-orange')}),e('div',{className:'grow'},e('strong',null,c.name),e('span',null,c.kind==='attendance'?'بر اساس جلسات ثبت‌شده':fmt(db.assessments.filter(a=>a.componentId===c.id).length)+' آیتم قابل نمره‌دهی')),badge(fmt(c.weight)+' نمره'),iconButton('edit',()=>{this.setState({moduleId:m.id},()=>this.open('component',c));},'ویرایش بخش'),iconButton('trash',()=>this.remove('component',c),'حذف بخش','danger')))),button('افزودن بخش نمره‌دهی','plus',()=>this.setState({moduleId:m.id},()=>this.open('component')),'soft',{className:'wide'}));})):e(Empty,{title:'هیچ پودمانی تعریف نشده',action:button('ایجاد پودمان','plus',()=>this.open('module'),'primary')}));}
  renderAssessments(){const m=this.currentModule,db=this.state.db;if(!m)return e(Empty,{title:'ابتدا یک پودمان تعریف کنید',action:button('ایجاد پودمان','plus',()=>this.open('module'),'primary')});const items=db.assessments.filter(a=>a.moduleId===m.id),selected=items.find(a=>a.id===this.state.assessmentId)||items[0];const componentOf=a=>db.components.find(c=>c.id===a.componentId);const allComponents=db.components.filter(c=>c.moduleId===m.id&&c.kind==='assessment');const markCount=a=>db.marks.filter(x=>x.assessmentId===a.id).length;return e('div',{className:'stack'},e('div',{className:'section-actions'},e('div',null,e('h2',null,'آزمون‌ها و تمرین‌ها'),e('p',null,'هر بخش می‌تواند هر تعداد آزمون، تمرین یا آیتم سفارشی داشته باشد.')),button('آیتم ارزشیابی جدید','plus',()=>this.open('assessment'),'primary',{disabled:!allComponents.length})),e('div',{className:'subnav-row'},e('label',null,'پودمان موردنظر'),e('select',{value:m.id,onChange:ev=>this.setState({moduleId:ev.target.value,assessmentId:null})},this.modules.map(x=>e('option',{key:x.id,value:x.id},x.name))),badge(fmt(items.length)+' آیتم')),allComponents.length===0?e('div',{className:'notice'},e(Icon,{name:'alert'}),'در این پودمان هنوز بخش نمره‌دهی از نوع آزمون/تمرین ندارید. از صفحه پودمان‌ها یک بخش ایجاد کنید.'):null,items.length?e('div',{className:'assessment-layout'},e('div',{className:'assessment-list panel'},e('h3',null,'آیتم‌های ارزشیابی'),items.map(a=>e('button',{key:a.id,className:cn('assessment-item',selected?.id===a.id&&'assessment-selected'),onClick:()=>this.setState({assessmentId:a.id})},e('div',{className:'assessment-icon'},e(Icon,{name:'clipboard',size:19})),e('div',{className:'grow'},e('strong',null,a.title),e('span',null,(componentOf(a)?.name||'بخش حذف‌شده')+' · از '+fmt(a.maxScore))),e('span',{className:'assess-count'},fmt(markCount(a))+'/'+fmt(this.students.length))))),selected?panel(selected.title,`${componentOf(selected)?.name||'بخش نامشخص'} · ${selected.date||'بدون تاریخ'} · سقف ${fmt(selected.maxScore)} نمره`,e('div',{className:'toolbar-actions'},iconButton('edit',()=>this.open('assessment',selected),'ویرایش آیتم'),iconButton('trash',()=>this.remove('assessment',selected),'حذف آیتم','danger')),e('div',{className:'table-scroll'},e('table',{className:'data-table'},e('thead',null,e('tr',null,e('th',null,'#'),e('th',null,'نام دانش‌آموز'),e('th',null,`نمره (از ${fmt(selected.maxScore)})`),e('th',null,'وضعیت'))),e('tbody',null,this.students.map((s,i)=>{const mark=db.marks.find(x=>x.assessmentId===selected.id&&x.studentId===s.id);return e('tr',{key:s.id},e('td',{className:'number'},fmt(i+1)),e('td',null,e('strong',null,s.name)),e('td',null,e('input',{className:'score-input',type:'number',min:0,max:selected.maxScore,step:'0.25',value:mark?mark.score:'',placeholder:'—',onChange:ev=>this.setMark(selected.id,s.id,ev.target.value,selected.maxScore),'aria-label':'نمره '+s.name})),e('td',null,mark?badge('ثبت شده','success'):badge('ثبت نشده','muted')));})))),'assessment-mark-panel'):null):e(Empty,{title:'هنوز آزمون یا تمرینی ثبت نشده',description:'اولین آیتم را با بارم دلخواه تعریف کنید.',action:allComponents.length?button('تعریف ارزشیابی','plus',()=>this.open('assessment'),'primary'):null}));}
  renderGrades(){
    const db=this.state.db,scope=this.reportScope, all=scope==='all', m=this.currentModule;
    if(!this.modules.length)return e(Empty,{title:'برای دریافت لیست نمرات، ابتدا یک پودمان ایجاد کنید.'});
    const report=EX.listRows(db,this.state.classId,scope);
    const grades=this.students.map(s=>({id:s.id,name:s.name,grade:all?null:L.calculateModule(db,s.id,m.id)}));
    const finished=report.rows.filter(r=>all?r[r.length-1]==='نهایی':r[r.length-2]==='نهایی').length;
    const scores=all?report.rows.map(r=>r[r.length-3]).filter(v=>typeof v==='number'):grades.filter(g=>g.grade.complete).map(g=>g.grade.total);
    const average=scores.length?L.round(scores.reduce((a,x)=>a+x,0)/scores.length):null;
    const comps=!all?db.components.filter(c=>c.moduleId===m.id):[];
    const weight=!all?L.moduleWeight(db,m.id):null;
    const selectedValue=this.state.gradeScope==='all'?'all':m.id;
    return e('div',{className:'stack grade-report-page'},
      e('div',{className:'section-actions no-print'},
        e('div',null,e('h2',null,'لیست نمرات و کارنامه'),e('p',null,'فیلتر پودمان، مشاهده ریزنمرات، چاپ و دریافت فایل اکسل استاندارد.')),
        e('div',{className:'toolbar-actions report-actions'},
          button('دانلود Excel','download',()=>this.exportGradeList('xlsx'),'primary'),
          button('CSV','download',()=>this.exportGradeList('csv')),
          button('چاپ لیست','print',()=>this.printGradeList()))),
      e('div',{className:'report-filter no-print'},
        e('div',{className:'filter-label'},e(Icon,{name:'layers',size:18}),e('div',null,e('strong',null,'محدوده گزارش'),e('small',null,'پودمان را تغییر دهید یا تمام پودمان‌ها را یکجا ببینید.'))),
        e('select',{className:'report-select',value:selectedValue,onChange:ev=>this.setState(ev.target.value==='all'?{gradeScope:'all'}:{gradeScope:'module',moduleId:ev.target.value})},
          e('option',{value:'all'},'تمام پودمان‌ها — خلاصه و خروجی یکجا'),
          this.modules.map(x=>e('option',{key:x.id,value:x.id},x.name))),
        all?badge(fmt(this.modules.length)+' پودمان','muted'):badge('مجموع وزن '+fmt(weight)+' از ۲۰',Math.abs(weight-20)<.001?'success':'warning')),
      e('div',{className:'print-report-title'},e('h2',null,'لیست نمرات '+report.title),e('p',null,`${report.klass.name} | ${report.klass.subject||'درس'} | سال تحصیلی ${report.klass.year||'—'}`)),
      e('div',{className:'stats-grid stats-three no-print'},
        e(Stat,{title:'دانش‌آموزان با نمره نهایی',value:finished,icon:'check',tint:'teal',suffix:'نفر'}),
        e(Stat,{title:'نیازمند تکمیل',value:Math.max(0,report.rows.length-finished),icon:'clock',tint:'orange',suffix:'نفر'}),
        e(Stat,{title:'میانگین نمرات نهایی',value:average??0,icon:'chart',tint:'indigo',suffix:average===null?'هنوز نمره نهایی ثبت نشده':'از ۲۰'})),
      !all && Math.abs(weight-20)>.001?e('div',{className:'notice notice-warn no-print'},e(Icon,{name:'alert',size:20}),`مجموع سهم بخش‌های ${m.name} برابر ${fmt(weight)} است. برای نهایی‌شدن نمرات باید دقیقاً ۲۰ باشد.`,button('تنظیم وزن‌ها','arrow',()=>this.go('modules'))):null,
      panel(all?'خلاصه نمرات تمام پودمان‌ها':`ریز نمرات ${m.name}`,
        all?'در خروجی Excel، برای هر پودمان یک شیت مجزا و یک شیت خلاصه ساخته می‌شود.':'مقادیر خالی به معنی نمره صفر نیستند و تا ثبت اطلاعات، نمره نهایی خالی می‌ماند.',
        e('span',{className:'report-count'},fmt(report.rows.length)+' دانش‌آموز'),
        e('div',{className:'table-scroll'},e('table',{className:'data-table grade-table'},
          e('thead',null,e('tr',null,report.headers.map((h,i)=>e('th',{key:i},h)))),
          e('tbody',null,report.rows.map((row,i)=>e('tr',{key:this.students[i]?.id||i},row.map((v,j)=>{
            const isStatus=j===row.length-2&&!all||j===row.length-1&&all;
            const isFinal=j===row.length-3&&!all||j===row.length-3&&all;
            return e('td',{key:j,className:cn(j===0&&'number',typeof v==='number'&&'score-cell',isFinal&&'final-grade-cell')},
              isStatus?badge(v,v==='نهایی'?'success':'warning'):
              (v===''||v==null)?e('span',{className:'pending-dash'},'—'):
              typeof v==='number'?e('strong',{className:isFinal?'final-grade':''},fmt(v)):j===1?e('strong',null,v):v);
          })))))),'table-panel'),
      e('div',{className:'explain-note no-print'},e(Icon,{name:'info',size:17}),
        'خروجی Excel شامل نمره هر بخش، نمره نهایی و وضعیت تکمیل است. اعداد صفر ثبت‌شده حفظ می‌شوند؛ نمره‌های ثبت‌نشده خالی صادر می‌شوند.'));
  }
  renderSettings(){const db=this.state.db;return e('div',{className:'stack'},e('div',{className:'section-actions'},e('div',null,e('h2',null,'تنظیمات و پشتیبان'),e('p',null,'حفاظت از داده‌های آموزشی و انتقال اطلاعات.'))),e('div',{className:'settings-grid'},panel('نمایش و رنگ‌بندی','تغییر سریع تم با ذخیره انتخاب شما در مرورگر',null,e('div',{className:'setting-action'},e('div',{className:'setting-art'},e(Icon,{name:this.state.theme==='dark'?'sun':'moon',size:30})),this.renderThemeSelector('settings-theme'))),this.renderFontSettings(),panel('پشتیبان‌گیری از تمام اطلاعات','کلاس‌ها، دانش‌آموزان، پودمان‌ها، جلسات و همه نمرات در یک فایل JSON',null,e('div',{className:'setting-action'},e('div',{className:'setting-art'},e(Icon,{name:'download',size:30})),button('دریافت نسخه پشتیبان','download',()=>this.exportBackup(),'primary'))),panel('بازیابی نسخه پشتیبان','تمام اطلاعات فعلی جایگزین فایل انتخاب‌شده خواهد شد.',null,e('div',{className:'setting-action'},e('div',{className:'setting-art'},e(Icon,{name:'upload',size:30})),e('label',{className:'btn btn-soft file-upload'},e(Icon,{name:'upload',size:17}),'انتخاب فایل JSON',e('input',{type:'file',accept:'.json,application/json',onChange:ev=>this.importBackup(ev)})))),panel('اطلاعات سامانه','ساختار داده‌ها و وضعیت کنونی',null,e('div',{className:'setting-details'},[['تعداد کلاس‌ها',db.classes.length],['دانش‌آموزان',db.students.length],['پودمان‌ها',db.modules.length],['جلسات',db.sessions.length],['آیتم‌های ارزشیابی',db.assessments.length]].map(x=>e('div',{key:x[0]},e('span',null,x[0]),e('strong',null,fmt(x[1])))))),panel('نکات مهم درباره نگهداری داده','برای کاربرد روزمره و بدون نیاز به اینترنت',null,e('div',{className:'tips'},e('p',null,'اگر سامانه را از طریق سرور محلی اجرا کنید، تمام اطلاعات کلاس و نمرات در MongoDB ذخیره می‌شود و یک نسخه در مرورگر می‌ماند.'),e('p',null,'بازکردن مستقیم index.html نیز ممکن است، اما اطلاعات فقط در همان مرورگر ذخیره می‌شود.'),e('p',null,'این نسخه برای یک دبیر طراحی شده و ورود کاربران، دسترسی چنددبیری و ذخیره‌سازی ابری ندارد؛ از اطلاعات به‌طور منظم پشتیبان تهیه کنید.')))));
  }
  renderModal(){const m=this.state.modal;if(!m)return null;const item=m.item||{};const classId=this.state.classId;const module=this.currentModule;let title='',fields=[];
    if(m.type==='class'){title=m.item?'ویرایش کلاس':'تعریف کلاس جدید';fields=[e(FormInput,{label:'نام کلاس',name:'name',value:item.name||'',required:true,placeholder:'مثلاً یازدهم شبکه'}),e('div',{className:'fields-two'},e(FormInput,{label:'پایه',name:'grade',value:item.grade||'10',kind:'select',options:[10,11,12,13].map(n=>({value:n,label:(''+n)}))}),e(FormInput,{label:'سال تحصیلی',name:'year',value:item.year||'۱۴۰۵–۱۴۰۶',required:true})),e(FormInput,{label:'نام درس',name:'subject',value:item.subject||'',placeholder:'عنوان درس'}),e(FormInput,{label:'رنگ شناسایی کلاس',name:'color',kind:'color',value:item.color||'#5666e9'})];}
    if(m.type==='student'){title=m.item?'ویرایش دانش‌آموز':'افزودن دانش‌آموز';fields=[e(FormInput,{label:'نام و نام خانوادگی',name:'name',value:item.name||'',required:true,placeholder:'نام کامل'}),e(FormInput,{label:'کد دانش‌آموزی (اختیاری)',name:'studentCode',value:item.studentCode||''}),e(FormInput,{label:'توضیحات',name:'note',kind:'textarea',value:item.note||'',placeholder:'مثلاً نیازمند بررسی نام در لیست'})];}
    if(m.type==='bulk'){title='افزودن گروهی دانش‌آموزان';fields=[e(FormInput,{label:'اسامی دانش‌آموزان (هر سطر یک نام)',name:'names',kind:'textarea',rows:9,required:true,placeholder:'علی محمدی\nرضا احمدی\n...'}),e('p',{className:'modal-hint'},'می‌توانید اسامی را از Excel کپی کرده و در این کادر جای‌گذاری کنید.')];}
    if(m.type==='module'){title=m.item?'ویرایش پودمان':'ایجاد پودمان';fields=[e(FormInput,{label:'نام پودمان',name:'name',value:item.name||'',required:true,placeholder:'مثلاً پودمان دوم'}),e(FormInput,{label:'ترتیب نمایش',name:'order',kind:'number',min:1,value:item.order||this.modules.length+1,required:true}),e(FormInput,{label:'توضیحات (اختیاری)',name:'description',value:item.description||'',kind:'textarea'})];}
    if(m.type==='component'){title=m.item?'ویرایش بخش نمره‌دهی':'افزودن بخش نمره‌دهی';fields=[e(FormInput,{label:'عنوان بخش',name:'name',value:item.name||'',required:true,placeholder:'مثلاً پروژه عملی'}),e(FormInput,{label:'نوع محاسبه',name:'kind',kind:'select',value:item.kind||'assessment',options:[{label:'براساس نمره آیتم‌ها (آزمون، تمرین، پروژه...)',value:'assessment'},{label:'براساس حضور در جلسات پودمان',value:'attendance'}]}),e(FormInput,{label:'سهم از نمره نهایی (از ۲۰)',name:'weight',kind:'number',value:item.weight??0,min:0,max:20,step:0.25,required:true}),e('p',{className:'modal-hint'},'می‌توانید هر تعداد بخش تعریف کنید؛ جمع وزن بخش‌ها باید ۲۰ شود. تغییر نوع بخش ممکن است روی ارزیابی‌های قبلی اثر بگذارد.')];}
    if(m.type==='session'){title=m.item?'ویرایش جلسه':'تعریف جلسه جدید';fields=[e(FormInput,{label:'عنوان جلسه',name:'title',value:item.title||'جلسه '+fmt(this.classSessions.length+1),required:true}),e(FormInput,{label:'تاریخ جلسه (شمسی)',name:'date',value:item.date||dateNow(),required:true,placeholder:'۱۴۰۵/۰۸/۱۱'}),e(FormInput,{label:'پودمان این جلسه',name:'moduleId',kind:'select',value:item.moduleId||module?.id||'',required:true,options:this.modules.map(x=>({value:x.id,label:x.name}))}),e('p',{className:'modal-hint'},'هر جلسه دقیقاً به یک پودمان متصل است؛ سهم حضور براساس جلسات همان پودمان محاسبه می‌شود.')];}
    if(m.type==='assessment'){const opts=this.state.db.components.filter(c=>c.moduleId===module?.id&&c.kind==='assessment');title=m.item?'ویرایش آیتم ارزشیابی':'آزمون یا تمرین جدید';fields=[e(FormInput,{label:'عنوان آیتم',name:'title',value:item.title||'',required:true,placeholder:'مثلاً آزمون پودمان اول'}),e(FormInput,{label:'بخش نمره‌دهی',name:'componentId',kind:'select',value:item.componentId||opts[0]?.id||'',required:true,options:opts.map(c=>({label:c.name,value:c.id}))}),e('div',{className:'fields-two'},e(FormInput,{label:'بارم این آیتم',name:'maxScore',kind:'number',min:0.25,step:0.25,value:item.maxScore??20,required:true}),e(FormInput,{label:'تاریخ (شمسی)',name:'date',value:item.date||dateNow()})),e('p',{className:'modal-hint'},'بارم این آیتم مستقل از سهم بخش است. همه آیتم‌های یک بخش به نسبت بارم خود در آن بخش اثر می‌گذارند.')];}
    return e('div',{className:'modal-backdrop',onMouseDown:ev=>{if(ev.target===ev.currentTarget)this.close();}},e('div',{className:'modal',role:'dialog','aria-modal':'true','aria-label':title},e('div',{className:'modal-head'},e('div',null,e('h3',null,title),e('p',null,'اطلاعات را تکمیل و ذخیره کنید.')),iconButton('close',()=>this.close(),'بستن')),e('form',{onSubmit:ev=>this.saveModal(ev)},e('div',{className:'modal-body'},fields.map((field,i)=>e('div',{key:i},field))),e('div',{className:'modal-footer'},button('انصراف',null,()=>this.close(),'ghost'),e('button',{className:'btn btn-primary',type:'submit'},e(Icon,{name:'save',size:17}),'ذخیره تغییرات')))));
  }
  render(){const current=this.selectedClass;let content;
    if(!current && !['classes','settings'].includes(this.state.view))content=e(Empty,{title:'هنوز کلاسی تعریف نشده است',description:'برای استفاده از امکانات سامانه، ابتدا یک کلاس ایجاد کنید.',action:button('تعریف کلاس','plus',()=>this.open('class'),'primary')});
    else switch(this.state.view){case 'classes':content=this.renderClasses();break;case 'students':content=this.renderStudents();break;case 'attendance':content=this.renderAttendance();break;case 'modules':content=this.renderModules();break;case 'assessments':content=this.renderAssessments();break;case 'grades':content=this.renderGrades();break;case 'settings':content=this.renderSettings();break;default:content=this.renderDashboard();}
    return e('div',{className:'app'},this.renderSidebar(),e('div',{className:'main-area'},this.renderHeader(),e('main',{className:'main-content'},this.renderClassSwitcher(),this.syncBlocked?e('div',{className:'notice no-print',role:'alert'},e(Icon,{name:'alert',size:18}),'تغییرات این دستگاه هنوز در سرور ذخیره نشده‌اند.',button('پشتیبان و دریافت نسخه سرور','download',()=>this.resolveConflict())):null,content,e('footer',{className:'app-footer'},'کلاس‌یار ۲ · طراحی پودمانی و گزارش‌گیری پویا · اطلاعات شما روی دستگاه شما'))),this.renderModal(),this.state.notification?e('div',{className:'toast'},e(Icon,{name:'check',size:18}),this.state.notification):null);
  }
}
ReactDOM.render(e(App),document.getElementById('root'));
})();
