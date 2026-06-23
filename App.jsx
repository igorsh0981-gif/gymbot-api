import { useState, useEffect, useRef, Fragment } from "react";

const tg = window.Telegram?.WebApp;
const API = "https://web-production-4fe0b.up.railway.app/api";

const C = {
  bg:"#0F0F0F", surface:"#1A1A1A", card:"#222222",
  accent:"#C8FF00", text:"#FFFFFF", muted:"#888888",
  border:"#2A2A2A", danger:"#FF4444", success:"#00CC66", warn:"#FFB800",
};

// ─── ATOMS ───────────────────────────────────────────────────────────────────
const Hero = ({children,style={}}) => <div style={{fontWeight:700,fontSize:26,letterSpacing:-0.5,lineHeight:1.15,color:C.text,textTransform:"uppercase",...style}}>{children}</div>;
const Kicker = ({children}) => <div style={{fontFamily:"monospace",fontSize:11,color:C.muted,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>{children}</div>;
const Mono = ({children,color=C.accent,size=18}) => <span style={{fontFamily:"monospace",fontWeight:700,fontSize:size,color}}>{children}</span>;

function Card({children,accent,danger,onClick,style={},pad="14px 16px"}){
  const border = accent?C.accent:danger?C.danger:C.border;
  return <div onClick={onClick} style={{background:C.card,border:`0.5px solid ${border}`,borderRadius:12,padding:pad,cursor:onClick?"pointer":"default",...style}}>{children}</div>;
}
function Loader({text="ЗАГРУЗКА"}){
  return <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh"}}><div style={{textAlign:"center"}}><div style={{fontFamily:"monospace",fontSize:12,color:C.accent,letterSpacing:3}}>{text}</div><div style={{color:C.muted,fontSize:24,marginTop:8}}>◌</div></div></div>;
}
function BackBtn({onBack}){
  return <button onClick={onBack} style={{background:"none",border:"none",color:C.muted,fontFamily:"monospace",fontSize:12,letterSpacing:1,cursor:"pointer",padding:"0 0 16px 0",display:"block"}}>← НАЗАД</button>;
}
function Btn({children,onClick,accent,danger,disabled,full,style={}}){
  const bg=accent?C.accent:danger?"#FF444422":C.card;
  const bc=accent?C.accent:danger?C.danger:C.border;
  const col=accent?C.bg:danger?C.danger:C.text;
  return <button onClick={onClick} disabled={disabled} style={{width:full?"100%":"auto",background:bg,border:`0.5px solid ${bc}`,borderRadius:10,padding:"13px 20px",color:col,fontWeight:700,fontSize:14,letterSpacing:0.5,textTransform:"uppercase",cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,...style}}>{children}</button>;
}
function Sel({value,onChange,options}){
  return <select value={value} onChange={e=>onChange(e.target.value)} style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",outline:"none",boxSizing:"border-box"}}>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}
function Tag({children,color=C.muted,bg}){
  return <span style={{background:bg||`${color}22`,border:`0.5px solid ${color}`,borderRadius:16,padding:"4px 10px",fontSize:12,color,display:"inline-block"}}>{children}</span>;
}
function ProgressBar({pct,color=C.accent}){
  return <div style={{background:C.border,borderRadius:4,height:6}}><div style={{width:`${Math.min(100,pct)}%`,height:"100%",background:pct>100?C.danger:color,borderRadius:4,transition:"width 0.4s"}}/></div>;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const MEDICAL_OPTIONS=[
  {key:"knee_injury",label:"🦵 Травма колена"},{key:"back_pain",label:"🔙 Боль в спине"},
  {key:"spine_issues",label:"🦴 Позвоночник"},{key:"shoulder_injury",label:"💪 Плечо/ротатор"},
  {key:"heart_disease",label:"❤️ Сердце/сосуды"},{key:"hypertension",label:"🩺 Гипертония"},
  {key:"hernia",label:"⚠️ Грыжа"},{key:"kidney_disease",label:"🫘 Почки"},{key:"diabetes",label:"💉 Диабет"},
];
const ALLERGY_OPTIONS=[
  {key:"lactose",label:"🥛 Лактоза"},{key:"gluten",label:"🌾 Глютен"},
  {key:"nuts",label:"🥜 Орехи"},{key:"soy",label:"🫘 Соя"},
  {key:"fish_oil",label:"🐟 Рыбий жир"},{key:"eggs",label:"🥚 Яйца"},
];
const MEDICAL_LABELS=Object.fromEntries(MEDICAL_OPTIONS.map(o=>[o.key,o.label]));
const ALLERGY_LABELS=Object.fromEntries(ALLERGY_OPTIONS.map(o=>[o.key,o.label]));
const GOAL_LABELS={lose_weight:"Похудение",gain_muscle:"Набор массы",gain_strength:"Сила",improve_endurance:"Выносливость",stay_healthy:"Здоровье"};
const LEVEL_LABELS={beginner:"Новичок",intermediate:"Средний",advanced:"Продвинутый"};
const DIFF_COLOR={easy:C.success,medium:C.accent,hard:C.danger};
const DIFF_LABEL={easy:"Лёгкое",medium:"Среднее",hard:"Сложное"};
const CARDIO_DISTANCE=["бег трусцой","интервальный бег","велосипед на улице","ходьба на беговой дорожке","бег на месте"];
const CARDIO_TIME=["зумба","танцевальная аэробика","степ-аэробика","плавание","кардио на лестнице","велотренажёр","эллиптический тренажёр"];

function cardioType(name=""){
  const n=name.toLowerCase();
  if(CARDIO_DISTANCE.some(c=>n.includes(c)||c.includes(n)))return "distance";
  if(CARDIO_TIME.some(c=>n.includes(c)||c.includes(n)))return "time";
  return null; // силовое
}

// ─── CHECKBOX GROUP ───────────────────────────────────────────────────────────
function CheckboxGroup({options,selected,onChange}){
  const toggle=key=>onChange(selected.includes(key)?selected.filter(k=>k!==key):[...selected,key]);
  return <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
    {options.map(o=>{const a=selected.includes(o.key);return(
      <button key={o.key} onClick={()=>toggle(o.key)} style={{padding:"7px 12px",borderRadius:20,fontSize:12,cursor:"pointer",background:a?C.accent:C.bg,border:`0.5px solid ${a?C.accent:C.border}`,color:a?C.bg:C.muted,fontWeight:a?700:400}}>{o.label}</button>
    );})}
  </div>;
}


// ─── REST TIMER (T-01) ────────────────────────────────────────────────────────
function RestTimer({onClose}){
  const PRESETS=[60,90,120,180];
  const [total,setTotal]=useState(90);
  const [left,setLeft]=useState(null); // null = не запущен
  const [running,setRunning]=useState(false);
  const intervalRef=useRef(null);

  function start(sec){
    setTotal(sec);setLeft(sec);setRunning(true);
  }
  function pause(){setRunning(false);}
  function resume(){setRunning(true);}
  function reset(){setRunning(false);setLeft(null);}
  function addTime(sec){setLeft(p=>p!=null?Math.max(0,p+sec):sec);}

  useEffect(()=>{
    if(!running)return;
    intervalRef.current=setInterval(()=>{
      setLeft(p=>{
        if(p<=1){
          setRunning(false);
          if(navigator.vibrate)navigator.vibrate([200,100,200,100,400]);
          // Звуковой сигнал через Web Audio API (работает на iOS и Android)
          try{
            const ctx=new(window.AudioContext||window.webkitAudioContext)();
            const beep=(freq,start,dur)=>{
              const o=ctx.createOscillator();
              const g=ctx.createGain();
              o.connect(g);g.connect(ctx.destination);
              o.frequency.value=freq;
              g.gain.setValueAtTime(0.4,ctx.currentTime+start);
              g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+start+dur);
              o.start(ctx.currentTime+start);
              o.stop(ctx.currentTime+start+dur);
            };
            beep(880,0,0.15);beep(880,0.2,0.15);beep(1100,0.4,0.3);
          }catch{}
          return 0;
        }
        return p-1;
      });
    },1000);
    return()=>clearInterval(intervalRef.current);
  },[running]);

  const pct=left!=null?Math.round((1-left/total)*100):0;
  const fmt=s=>{if(s==null)return"--:--";const m=Math.floor(s/60);const sec=s%60;return`${m}:${sec.toString().padStart(2,"0")}`;};
  const done=left===0;

  return(
    <Fragment>
    <div style={{position:"fixed",bottom:0,left:0,right:0,top:0,zIndex:199,background:"rgba(0,0,0,0.6)"}} onClick={e=>{if(e.target===e.currentTarget){reset();onClose();}}}/>
    <div style={{position:"fixed",bottom:"calc(70px + env(safe-area-inset-bottom))",left:16,right:16,background:C.surface,border:`0.5px solid ${done?C.success:C.accent}`,borderRadius:16,padding:"16px",zIndex:200,boxShadow:"0 -4px 24px rgba(0,0,0,0.4)"}}>
      {/* Прогресс-бар */}
      <div style={{background:C.border,borderRadius:4,height:4,marginBottom:12,overflow:"hidden"}}>
        <div style={{width:`${pct}%`,height:"100%",background:done?C.success:C.accent,borderRadius:4,transition:"width 1s linear"}}/>
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:2}}>
            {done?"✓ ОТДЫХ ЗАВЕРШЁН":left!=null?"ОТДЫХ":"ВЫБЕРИ ВРЕМЯ"}
          </div>
          <div style={{fontSize:36,fontFamily:"monospace",fontWeight:700,color:done?C.success:C.accent,lineHeight:1}}>
            {fmt(left)}
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {left!=null&&!done&&(
            <button onClick={running?pause:resume}
              style={{background:C.accent,border:"none",borderRadius:10,padding:"8px 16px",color:C.bg,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"monospace"}}>
              {running?"⏸ ПАУЗА":"▶ СТАРТ"}
            </button>
          )}
          <button onClick={()=>{reset();onClose();}}
            style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:10,padding:"8px 12px",color:C.muted,fontSize:13,cursor:"pointer"}}>
            ✕
          </button>
        </div>
      </div>

      {left!=null&&!done?(
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>addTime(30)} style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px",color:C.text,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>+30 сек</button>
          <button onClick={()=>addTime(-15)} style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px",color:C.muted,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>−15 сек</button>
          <button onClick={reset} style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px",color:C.danger,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>СБРОС</button>
        </div>
      ):(
        <div style={{display:"flex",gap:6}}>
          {PRESETS.map(s=>(
            <button key={s} onClick={()=>start(s)}
              style={{flex:1,background:done&&total===s?C.success:C.card,border:`0.5px solid ${done&&total===s?C.success:C.border}`,borderRadius:8,padding:"8px 4px",color:done&&total===s?"#fff":C.muted,fontSize:12,fontFamily:"monospace",cursor:"pointer",fontWeight:done&&total===s?700:400}}>
              {s}с
            </button>
          ))}
        </div>
      )}
    </div>
    </Fragment>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
function NavBar({active,onChange}){
  const tabs=[{id:"menu",icon:"⊞",label:"Меню"},{id:"workout",icon:"▶",label:"Тренировки"},{id:"progress",icon:"↗",label:"Прогресс"},{id:"catalog",icon:"☰",label:"Каталог"},{id:"ai",icon:"●",label:"Тренер"}];
  return <div style={{position:"fixed",bottom:0,left:0,right:0,background:C.surface,borderTop:`0.5px solid ${C.border}`,display:"flex",padding:"8px 0 calc(8px + env(safe-area-inset-bottom))",zIndex:100}}>
    {tabs.map(t=><button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"4px 0"}}>
      <span style={{fontSize:18,color:active===t.id?C.accent:C.muted}}>{t.icon}</span>
      <span style={{fontSize:10,fontFamily:"monospace",letterSpacing:0.5,color:active===t.id?C.accent:C.muted}}>{t.label}</span>
    </button>)}
  </div>;
}

// ─── EXERCISE CARD ────────────────────────────────────────────────────────────
function ExCard({ex,onClick,badge,action}){
  return <Card onClick={onClick} style={{marginBottom:8}}>
    <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
      {ex.photo_url&&<img src={ex.photo_url} alt="" style={{width:56,height:56,borderRadius:8,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
          <div style={{fontWeight:600,fontSize:14,color:C.text,lineHeight:1.3}}>{ex.name}</div>
          {badge&&<Tag color={DIFF_COLOR[ex.difficulty]||C.muted}>{badge}</Tag>}
        </div>
        <div style={{fontSize:11,color:C.muted,marginTop:3}}>{ex.group_emoji} {ex.group_name}</div>
        <div style={{display:"flex",gap:10,marginTop:6}}>
          <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.sets_recommended} подх</span>
          <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.reps_recommended} повт</span>
          {ex.equipment&&<span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.equipment}</span>}
        </div>
      </div>
      {action}
    </div>
  </Card>;
}

// ─── MENU ─────────────────────────────────────────────────────────────────────
function MenuScreen({user,onNav}){
  const streak=user?.streak_days||0;
  const actions=[
    {label:"Таймер отдыха",icon:"⏱",s:"rest_timer"},
    {label:"Запланировать",icon:"📅",s:"plan_workout"},
    {label:"Цели",icon:"🎯",s:"goals"},
    {label:"Напоминания",icon:"🔔",s:"reminders"},
    {label:"Питание",icon:"◈",s:"nutrition"},
    {label:"Каталог продуктов",icon:"🥗",s:"food_guide"},
    {label:"Замеры тела",icon:"○",s:"measurements"},
    {label:"Чек-ин",icon:"✓",s:"checkin"},
    {label:"Добавки",icon:"◆",s:"supplements"},
    {label:"Язык",icon:"🌐",s:"language"},
    {label:"Поддержка",icon:"?",s:"support"},
  ];
  return <div style={{padding:"16px 16px 100px"}}>
    <div style={{marginBottom:20}}>
      {streak>0&&<div style={{fontFamily:"monospace",fontSize:12,color:C.accent,marginBottom:8}}>🔥 {streak} {streak===1?"ДЕНЬ":"ДНЯ"} ПОДРЯД</div>}
      <Hero>О, ТЫ ВЕРНУЛСЯ{user?.first_name?`, ${user.first_name.split(" ")[0].toUpperCase()}`:""}</Hero>
      {user?.desired_result&&<div style={{color:C.muted,fontSize:13,marginTop:6,fontFamily:"monospace"}}>ЦЕЛЬ · {GOAL_LABELS[user.desired_result]||user.desired_result}</div>}
      {user?._not_found&&<div style={{background:"#FFB80022",border:`0.5px solid ${C.warn}`,borderRadius:10,padding:"10px 14px",marginTop:10,fontSize:12,color:C.warn,lineHeight:1.6}}>
        ⚠️ Профиль не найден. Сначала пройди регистрацию в <b>@GYMASH_bot</b>, затем вернись в приложение.
      </div>}
    </div>
    <Btn accent full onClick={()=>onNav("active_workout")} style={{marginBottom:16}}>▶ НАЧАТЬ ТРЕНИРОВКУ</Btn>
    <Kicker>БЫСТРЫЙ ДОСТУП</Kicker>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16,marginTop:8}}>
      {actions.map(a=><Card key={a.s} onClick={()=>onNav(a.s)}>
        <div style={{fontSize:18,color:C.accent,marginBottom:4}}>{a.icon}</div>
        <div style={{fontSize:13,color:C.text,fontWeight:500}}>{a.label}</div>
      </Card>)}
    </div>
    {user&&<><Kicker>ПРОФИЛЬ</Kicker>
      <Card onClick={()=>onNav("profile")} style={{marginTop:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontWeight:600,fontSize:15,color:C.text}}>{user.first_name}</div>
            <div style={{fontSize:12,color:C.muted,marginTop:2}}>{user.age} лет · {user.weight} кг · {user.height} см</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,fontFamily:"monospace",color:C.accent}}>{user.fitness_level?.toUpperCase()||"—"}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:2}}>ИЗМЕНИТЬ →</div>
          </div>
        </div>
        <div style={{borderTop:`0.5px solid ${C.border}`,marginTop:10,paddingTop:10,display:"flex",gap:16}}>
          <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ИМТ</div><Mono>{user.bmi||"—"}</Mono></div>
          <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>AI ЗАПРОСОВ</div><Mono>{user.ai_requests_today||0}/5</Mono></div>
        </div>
      </Card>
    </>}
  </div>;
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
function ProfileScreen({user,tgId,onBack,onUserUpdated}){
  const [editing,setEditing]=useState(false);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [form,setForm]=useState({age:"",weight:"",height:"",gender:"male",fitness_level:"beginner",desired_result:"stay_healthy",medical_conditions:[],allergies:[]});

  if(!user)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="ПРОФИЛЬ"/></div>;

  function startEdit(){
    setForm({age:user.age||"",weight:user.weight||"",height:user.height||"",gender:user.gender||"male",fitness_level:user.fitness_level||"beginner",desired_result:user.desired_result||"stay_healthy",
      medical_conditions:(user.medical_conditions||[]).filter(c=>c!=="none"),
      allergies:(user.allergies||[]).filter(a=>a!=="none"),
    });setEditing(true);
  }
  async function handleSave(){
    setSaving(true);
    try{
      const body={age:parseInt(form.age)||undefined,weight:parseFloat(form.weight)||undefined,height:parseInt(form.height)||undefined,
        gender:form.gender,fitness_level:form.fitness_level,desired_result:form.desired_result,
        medical_conditions:form.medical_conditions.length?form.medical_conditions:["none"],
        allergies:form.allergies.length?form.allergies:["none"]};
      const res=await fetch(`${API}/user/${tgId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(res.ok){setSaved(true);setEditing(false);onUserUpdated();setTimeout(()=>setSaved(false),3000);}
      else if(res.status===404){alert("Профиль не найден. Сначала пройди регистрацию в боте @GYMASH_bot, затем вернись сюда.");}
      else{alert(`Ошибка сохранения (${res.status}).`);}
    }catch(e){alert("Нет соединения. Проверь интернет.");}finally{setSaving(false);}
  }

  const medNames=(user.medical_conditions||[]).filter(c=>c!=="none").map(c=>MEDICAL_LABELS[c]||c);
  const algNames=(user.allergies||[]).filter(a=>a!=="none").map(a=>ALLERGY_LABELS[a]||a);
  const rows=[{l:"Возраст",v:user.age?`${user.age} лет`:"—"},{l:"Вес",v:user.weight?`${user.weight} кг`:"—"},{l:"Рост",v:user.height?`${user.height} см`:"—"},{l:"ИМТ",v:user.bmi||"—"},{l:"Уровень",v:LEVEL_LABELS[user.fitness_level]||"—"},{l:"Цель",v:GOAL_LABELS[user.desired_result]||"—"},{l:"Язык",v:(user.lang||"ru").toUpperCase()},{l:"AI сегодня",v:`${user.ai_requests_today||0}/5`}];

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>МОЙ ПРОФИЛЬ</Kicker>
    <Hero>{user.first_name||"Атлет"}</Hero>
    {user.username&&<div style={{color:C.muted,fontSize:13,marginTop:4,fontFamily:"monospace"}}>@{user.username}</div>}
    <div style={{height:16}}/>
    {saved&&<div style={{background:"#00CC6622",border:`0.5px solid ${C.success}`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontFamily:"monospace",fontSize:12,color:C.success}}>✓ СОХРАНЕНО</div>}
    {!editing?<>
      <Card style={{marginBottom:12}}>
        {rows.map((r,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<rows.length-1?`0.5px solid ${C.border}`:"none"}}>
          <span style={{fontSize:13,color:C.muted,fontFamily:"monospace"}}>{r.l}</span>
          <span style={{fontSize:13,color:C.text,fontWeight:500}}>{r.v}</span>
        </div>)}
      </Card>
      <div style={{marginBottom:12}}>
        <Kicker>МЕД. ПОКАЗАТЕЛИ / ПРОТИВОПОКАЗАНИЯ</Kicker>
        <Card>{medNames.length>0?<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{medNames.map((n,i)=><Tag key={i} color={C.danger}>{n}</Tag>)}</div>:<span style={{fontSize:13,color:C.muted}}>Не указано</span>}</Card>
      </div>
      <div style={{marginBottom:16}}>
        <Kicker>АЛЛЕРГИИ</Kicker>
        <Card>{algNames.length>0?<div style={{display:"flex",flexWrap:"wrap",gap:6}}>{algNames.map((n,i)=><Tag key={i} color={C.warn}>{n}</Tag>)}</div>:<span style={{fontSize:13,color:C.muted}}>Не указано</span>}</Card>
      </div>
      <Btn accent full onClick={startEdit}>✏ РЕДАКТИРОВАТЬ ПРОФИЛЬ</Btn>
    </>:<>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        {[{label:"Возраст (лет)",key:"age",placeholder:"45"},{label:"Вес (кг)",key:"weight",placeholder:"86"},{label:"Рост (см)",key:"height",placeholder:"186"}].map(f=><Card key={f.key}>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{f.label.toUpperCase()}</div>
          <input type="number" value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={{background:"none",border:"none",color:C.accent,fontSize:22,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none"}}/>
        </Card>)}
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ПОЛ</div><Sel value={form.gender} onChange={v=>setForm(p=>({...p,gender:v}))} options={[{value:"male",label:"Мужской"},{value:"female",label:"Женский"}]}/></Card>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>УРОВЕНЬ</div><Sel value={form.fitness_level} onChange={v=>setForm(p=>({...p,fitness_level:v}))} options={[{value:"beginner",label:"Новичок"},{value:"intermediate",label:"Средний"},{value:"advanced",label:"Продвинутый"}]}/></Card>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ЦЕЛЬ</div><Sel value={form.desired_result} onChange={v=>setForm(p=>({...p,desired_result:v}))} options={[{value:"lose_weight",label:"Похудение"},{value:"gain_muscle",label:"Набор массы"},{value:"gain_strength",label:"Сила"},{value:"improve_endurance",label:"Выносливость"},{value:"stay_healthy",label:"Здоровье"}]}/></Card>
        <Card>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:10}}>МЕД. ПОКАЗАТЕЛИ / ПРОТИВОПОКАЗАНИЯ</div>
          <CheckboxGroup options={MEDICAL_OPTIONS} selected={form.medical_conditions} onChange={v=>setForm(p=>({...p,medical_conditions:v}))}/>
          {form.medical_conditions.length===0&&<div style={{fontSize:11,color:C.muted,marginTop:8,fontFamily:"monospace"}}>Нет противопоказаний</div>}
        </Card>
        <Card>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:10}}>АЛЛЕРГИИ</div>
          <CheckboxGroup options={ALLERGY_OPTIONS} selected={form.allergies} onChange={v=>setForm(p=>({...p,allergies:v}))}/>
          {form.allergies.length===0&&<div style={{fontSize:11,color:C.muted,marginTop:8,fontFamily:"monospace"}}>Нет аллергий</div>}
        </Card>
      </div>
      <div style={{display:"flex",gap:10}}>
        <Btn full onClick={()=>setEditing(false)} style={{flex:1}}>ОТМЕНА</Btn>
        <Btn accent full onClick={handleSave} disabled={saving} style={{flex:2}}>{saving?"СОХРАНЯЕМ...":"СОХРАНИТЬ"}</Btn>
      </div>
    </>}
  </div>;
}

// ─── WORKOUT HISTORY ──────────────────────────────────────────────────────────
function WorkoutHistoryScreen({workouts,onNav,tgId}){
  const [activeTab,setActiveTab]=useState("planned"); // "history" | "planned"
  const [planned,setPlanned]=useState(null);
  const [deleting,setDeleting]=useState(null);

  useEffect(()=>{
    if(activeTab==="planned"&&!planned){
      if(tgId)fetch(`${API}/planned/${tgId}`).then(r=>r.json()).then(d=>setPlanned(d)).catch(()=>setPlanned({planned:[],archive:[]}));
      else setPlanned({planned:[],archive:[]});
    }
  },[activeTab]);

  async function delPlanned(id){
    setDeleting(id);
    try{await fetch(`${API}/planned/${tgId}/${id}`,{method:"DELETE"});setPlanned(null);}
    catch{}finally{setDeleting(null);}
  }

  const fmtDt=iso=>{if(!iso)return"—";const d=new Date(iso);return d.toLocaleString("ru",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});};
  const statusColor={scheduled:C.accent,reminded:C.warn,completed:C.success,missed:C.danger};

  if(!workouts)return <div style={{padding:"16px 16px 100px"}}><Loader text="ТРЕНИРОВКИ"/></div>;

  return <div style={{padding:"16px 16px 100px"}}>
    <Hero>ТРЕНИРОВКИ</Hero>
    <div style={{height:12}}/>
    {/* Вкладки */}
    <div style={{display:"flex",gap:0,marginBottom:16,border:`0.5px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
      {[{id:"planned",label:"📅 ЗАПЛАНИРОВАННЫЕ"},{id:"history",label:"📋 АРХИВНЫЕ"}].map(t=>(
        <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{flex:1,padding:"10px 8px",background:activeTab===t.id?C.accent:C.card,border:"none",color:activeTab===t.id?C.bg:C.muted,fontFamily:"monospace",fontSize:11,fontWeight:700,cursor:"pointer",letterSpacing:1}}>
          {t.label}
        </button>
      ))}
    </div>
    <Btn accent full onClick={()=>onNav("active_workout")} style={{marginBottom:16}}>▶ НАЧАТЬ ТРЕНИРОВКУ</Btn>

    {activeTab==="history"&&(
      workouts.length===0
        ?<Card><div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:32,marginBottom:8}}>◎</div><div style={{color:C.muted}}>Тренировок пока нет</div></div></Card>
        :<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {workouts.map(w=><Card key={w.id} onClick={()=>onNav("workout_detail",{workoutId:w.id})}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <Kicker>{new Date(w.date||w.started_at).toLocaleDateString("ru",{day:"numeric",month:"short"})}</Kicker>
                <div style={{fontWeight:600,fontSize:15,color:C.text}}>{w.workout_type==="completed"?"Тренировка":w.workout_type||"Тренировка"}</div>
              </div>
              <div style={{textAlign:"right"}}><Mono>{w.sets_count||0}</Mono><span style={{fontSize:11,color:C.muted}}> подх</span></div>
            </div>
            <div style={{borderTop:`0.5px solid ${C.border}`,marginTop:10,paddingTop:10,display:"flex",gap:20}}>
              <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ТОННАЖ</div><Mono>{Math.round((w.total_volume||0)/1000*10)/10}</Mono><span style={{fontSize:11,color:C.muted}}> т</span></div>
              <div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>СТАТУС</div><span style={{fontSize:12,fontFamily:"monospace",color:w.status==="finished"?C.success:C.muted}}>{w.status==="finished"?"✓ ЗАВЕРШЕНА":w.status||"—"}</span></div>
            </div>
            <div style={{marginTop:8,fontSize:11,color:C.accent,fontFamily:"monospace"}}>ОТКРЫТЬ СОСТАВ →</div>
          </Card>)}
        </div>
    )}

    {activeTab==="planned"&&(
      !planned?<Loader text="ПЛАН"/>:<>
        {planned.planned?.length===0&&<Card style={{marginBottom:12}}><div style={{textAlign:"center",padding:"12px 0",color:C.muted,fontSize:14}}>Нет запланированных тренировок</div></Card>}
        {planned.planned?.map(pw=><Card key={pw.id} style={{marginBottom:8}} onClick={()=>onNav("planned_detail",{pwId:pw.id})}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:14,color:C.text}}>{pw.title}</div>
              <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginTop:3}}>{fmtDt(pw.planned_datetime)}</div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:11,fontFamily:"monospace",color:statusColor[pw.status]||C.muted}}>{pw.status?.toUpperCase()}</span>
              <button onClick={e=>{e.stopPropagation();delPlanned(pw.id);}} disabled={deleting===pw.id} style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:6,padding:"3px 8px",color:C.danger,fontSize:11,cursor:"pointer"}}>{deleting===pw.id?"...":"✗"}</button>
            </div>
          </div>
          <div style={{marginTop:8,fontSize:11,color:C.accent,fontFamily:"monospace"}}>ОТКРЫТЬ СОСТАВ →</div>
        </Card>)}
        <Btn full onClick={()=>onNav("plan_workout")} style={{marginTop:8}}>+ ЗАПЛАНИРОВАТЬ ТРЕНИРОВКУ</Btn>
        {planned.archive?.length>0&&<>
          <div style={{marginTop:20,marginBottom:8}}><Kicker>АРХИВ</Kicker></div>
          {planned.archive.map(pw=><Card key={pw.id} style={{marginBottom:8,opacity:0.6}} onClick={()=>onNav("planned_detail",{pwId:pw.id,readOnly:true})}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div><div style={{fontWeight:600,fontSize:14,color:C.muted}}>{pw.title}</div><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginTop:2}}>{fmtDt(pw.planned_datetime)}</div></div>
              <span style={{fontSize:11,fontFamily:"monospace",color:statusColor[pw.status]||C.muted}}>{pw.status?.toUpperCase()}</span>
            </div>
          </Card>)}
        </>}
      </>
    )}
  </div>;
}

// ─── WORKOUT DETAIL ───────────────────────────────────────────────────────────
function WorkoutDetailScreen({workoutId,tgId,onBack}){
  const [data,setData]=useState(null);
  useEffect(()=>{
    if(!workoutId||!tgId){setData({exercises:[],status:"error",_nodata:true});return;}
    fetch(`${API}/workout/${workoutId}?tg_id=${tgId}`)
      .then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
      .then(setData)
      .catch(()=>setData({exercises:[],status:"error",_nodata:true}));
  },[workoutId]);

  if(!data)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="ЗАГРУЗКА"/></div>;
  if(data._nodata)return(
  <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>ОШИБКА</Kicker>
    <Hero style={{fontSize:20}}>НЕ УДАЛОСЬ ЗАГРУЗИТЬ</Hero>
    <div style={{height:16}}/>
    <Card danger>
      <div style={{fontSize:13,color:C.danger,fontFamily:"monospace",lineHeight:1.6}}>
        Тренировка не найдена или нет доступа.<br/>
        Попробуй открыть через Telegram-бот.
      </div>
    </Card>
    <Btn full onClick={onBack} style={{marginTop:16}}>← НАЗАД</Btn>
  </div>
);

  // Тренировка в процессе (active) — показываем что есть
  const isActive = data.status === "active";
  const totalSets=data.exercises?.reduce((s,e)=>s+e.sets.length,0)||0;
  const dateStr=data.date?new Date(data.date).toLocaleDateString("ru",{day:"numeric",month:"long",year:"numeric"}):"—";

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>{dateStr}</Kicker>
    <Hero>СОСТАВ ТРЕНИРОВКИ</Hero>
    <div style={{height:12}}/>
    {isActive&&<div style={{background:"#FFB80022",border:`0.5px solid ${C.warn}`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:C.warn,fontFamily:"monospace"}}>⚠️ ТРЕНИРОВКА ЕЩЁ ВЫПОЛНЯЕТСЯ</div>}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
      {[{l:"ПОДХОДОВ",v:totalSets},{l:"ТОННАЖ",v:`${Math.round((data.total_volume||0)/1000*10)/10} т`},{l:"СТАТУС",v:data.status==="finished"?"✓":data.status||"—"}].map((s,i)=><Card key={i} style={{textAlign:"center"}}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div><Mono size={14}>{s.v}</Mono></Card>)}
    </div>

    {data.exercises?.length===0&&<Card><div style={{textAlign:"center",padding:"16px 0",color:C.muted}}>Нет записей о подходах</div></Card>}

    {data.exercises?.map((ex,i)=><Card key={i} style={{marginBottom:10}}>
      <div style={{fontWeight:700,fontSize:15,color:C.text,marginBottom:10}}>{i+1}. {ex.name}</div>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr 1fr",gap:"4px 12px",alignItems:"center"}}>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ПХ</div>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ВЕС</div>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>ПОВТ</div>
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>RPE</div>
        {ex.sets.map((s,si)=>(
          <Fragment key={`set-${si}`}>
            <Mono size={13}>{s.set_number}</Mono>
            <Mono size={13}>{s.weight!=null?`${s.weight} кг`:"—"}</Mono>
            <Mono size={13}>{s.reps!=null?`${s.reps}`:"—"}</Mono>
            <Mono size={13} color={C.muted}>{s.rpe||"—"}</Mono>
          </Fragment>
        ))}
      </div>
    </Card>)}
  </div>;
}

// ─── ACTIVE WORKOUT ───────────────────────────────────────────────────────────
function ActiveWorkoutScreen({tgId,exercises,muscleGroups,onBack,onFinish,preselectedExIds=[]}){
  const STEP={SG:0,SE:1,WU:2,OR:3,LG:4,FN:5};
  const initStep=preselectedExIds?.length>0?3:0; // если есть preselected — сразу ORDER(3)
  const [step,setStep]=useState(initStep);
  const [selGroups,setSelGroups]=useState(new Set()); // мультивыбор групп
  const [selExs,setSelExs]=useState([]);
  const [warmup,setWarmup]=useState(null);
  const [warmupDone,setWarmupDone]=useState(false); // B-03: разминка выполнена
  const [workoutId,setWorkoutId]=useState(null);
  const [curIdx,setCurIdx]=useState(0);
  const [sets,setSets]=useState({});
  const [startTime]=useState(Date.now());
  const [exSearch,setExSearch]=useState("");
  const [replaceIdx,setReplaceIdx]=useState(null);
  const [localSet,setLocalSet]=useState({reps:"",weight:"",time:"",distance:""});
  const [logBusy,setLogBusy]=useState(false); // B-04: блокировка двойного нажатия
  const [lgReplaceMode,setLgReplaceMode]=useState(false); // B-07: замена упражнения
  const [aiReview,setAiReview]=useState(null); // B-06: AI оценка (null=загрузка, ""=ошибка)
  const [showTimer,setShowTimer]=useState(false);

  const allEx=exercises||[];

  // Заполняем selExs из preselectedExIds (запуск из запланированной тренировки)
  useEffect(()=>{
    if(preselectedExIds?.length>0&&allEx.length>0&&selExs.length===0){
      const preEx=preselectedExIds
        .map((id,i)=>{const ex=allEx.find(e=>e.id===id);return ex?{...ex,order:i+1}:null;})
        .filter(Boolean);
      if(preEx.length>0)setSelExs(preEx);
    }
  },[allEx.length]);
  const filteredEx=allEx.filter(e=>(selGroups.size===0||selGroups.has(e.muscle_group_id))&&(!exSearch||e.name.toLowerCase().includes(exSearch.toLowerCase())));
  const cardioExs=allEx.filter(e=>e.muscle_group_id===9);

  function toggleEx(ex){setSelExs(p=>{const h=p.find(e=>e.id===ex.id);if(h)return p.filter(e=>e.id!==ex.id);return[...p,{...ex,order:p.length+1}];});}
  function moveEx(i,d){setSelExs(p=>{const a=[...p],t=i+d;if(t<0||t>=a.length)return a;[a[i],a[t]]=[a[t],a[i]];return a.map((e,j)=>({...e,order:j+1}));});}
  function doReplace(i,ex){setSelExs(p=>p.map((e,j)=>j===i?{...ex,order:e.order}:e));setReplaceIdx(null);}
  function stepBack(){if(step===STEP.SG)onBack();else if(step===STEP.SE){setStep(STEP.SG);}else if(step===STEP.WU)setStep(STEP.SE);else if(step===STEP.OR)setStep(STEP.WU);}

  async function startWorkout(){
    try{
      const r=await fetch(`${API}/workout/start/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({exercise_ids:selExs.map(e=>e.id)})});
      const d=await r.json();setWorkoutId(d.workout_id);
      const init={};selExs.forEach(e=>{init[e.id]=[];});setSets(init);setStep(STEP.LG);
    }catch{alert("Ошибка запуска");}
  }
  async function doLog(){
    const ex=selExs[curIdx];if(!ex||!workoutId)return;
    const done=(sets[ex.id]||[]).length;
    await fetch(`${API}/workout/${workoutId}/set?tg_id=${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({exercise_id:ex.id,exercise_name:ex.name,set_number:done+1,reps:parseInt(localSet.reps)||null,weight:parseFloat(localSet.weight)||null,duration_sec:parseInt(localSet.time)||null,distance_km:parseFloat(localSet.distance)||null})});
    setSets(p=>({...p,[ex.id]:[...(p[ex.id]||[]),{...localSet}]}));
    setLocalSet({reps:"",weight:"",time:"",distance:""});
  }
  async function finish(){
    const dur=Math.round((Date.now()-startTime)/60000);
    try{if(workoutId)await fetch(`${API}/workout/${workoutId}/finish?tg_id=${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({duration_minutes:dur})});}
    catch{}
    if(onFinish)onFinish();
    setStep(STEP.FN);
    // B-06: запрашиваем AI оценку тренировки
    try{
      const totalSetsCount=Object.values(sets).reduce((s,a)=>s+a.length,0);
      const exList=selExs.map((e,i)=>{
        const exSets=sets[e.id]||[];
        const setsStr=exSets.map(s=>s.weight?`${s.weight}кг×${s.reps}`:s.time?`${s.time}с`:"—").join(", ");
        return `${i+1}. ${e.name}: ${setsStr||"нет данных"}`;
      }).join("\n");
      const q=`Оцени мою тренировку. Длительность: ${dur} мин. Упражнений: ${selExs.length}. Подходов: ${totalSetsCount}.

Состав:
${exList}

Дай короткую оценку (3-4 предложения): что хорошо, что улучшить, совет на следующую тренировку.`;
      const res=await fetch(`${API}/ai/ask`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:q,tg_id:tgId,skip_limit:true})});
      if(res.status===429){setAiReview("__limit__");return;}
      if(!res.ok){setAiReview("__error__");return;}
      const d=await res.json();
      setAiReview(d.answer||"__error__");
    }catch{setAiReview("__error__");}
  }

  if(step===STEP.FN)return(
    <div style={{padding:"16px 16px 100px"}}>
      <div style={{textAlign:"center",paddingTop:32,paddingBottom:24}}>
        <div style={{fontSize:60}}>🏆</div>
        <Hero style={{textAlign:"center",marginTop:16}}>ТРЕНИРОВКА ЗАВЕРШЕНА</Hero>
        <div style={{color:C.muted,fontSize:14,marginTop:8}}>Отличная работа!</div>
        <div style={{marginTop:8,fontFamily:"monospace",color:C.accent,fontSize:20}}>{Math.round((Date.now()-startTime)/60000)} МИНУТ</div>
      </div>

      {/* Итоги */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
        {[
          {l:"УПРАЖНЕНИЙ",v:selExs.length},
          {l:"ПОДХОДОВ",v:Object.values(sets).reduce((s,a)=>s+a.length,0)},
          {l:"МИНУТ",v:Math.round((Date.now()-startTime)/60000)},
        ].map((s,i)=><Card key={i} style={{textAlign:"center"}}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div><Mono size={18}>{s.v}</Mono></Card>)}
      </div>

      {/* B-06: AI оценка тренировки */}
      {aiReview===null?(
        <Card accent style={{marginBottom:16}}>
          <Kicker>AI ТРЕНЕР</Kicker>
          <div style={{textAlign:"center",padding:"12px 0"}}>
            <div style={{color:C.accent,fontFamily:"monospace",fontSize:12,letterSpacing:2}}>АНАЛИЗИРУЕТ ТРЕНИРОВКУ...</div>
            <div style={{color:C.muted,fontSize:24,marginTop:8}}>◌</div>
          </div>
        </Card>
      ):aiReview&&aiReview!=="__limit__"&&aiReview!=="__error__"?(
        <Card accent style={{marginBottom:16}}>
          <Kicker>ОЦЕНКА AI ТРЕНЕРА</Kicker>
          <div style={{fontSize:14,color:C.text,lineHeight:1.7,marginTop:8,whiteSpace:"pre-wrap"}}>{aiReview}</div>
        </Card>
      ):aiReview==="__limit__"?(
        <Card style={{marginBottom:16}}>
          <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"8px 0"}}>
            💬 Лимит AI запросов на сегодня исчерпан — оценка будет доступна завтра
          </div>
        </Card>
      ):aiReview==="__error__"?(
        <Card style={{marginBottom:16}}>
          <div style={{fontSize:13,color:C.muted,textAlign:"center",padding:"8px 0"}}>
            Не удалось получить оценку AI — проверь соединение
          </div>
        </Card>
      ):null}

      <Btn accent full onClick={onBack} style={{marginTop:8}}>← В МЕНЮ</Btn>
    </div>
  );

  if(step===STEP.SG)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={onBack}/>
      <Kicker>ШАГ 1 / 4</Kicker><Hero>ГРУППЫ МЫШЦ</Hero>
      <div style={{fontSize:13,color:C.muted,marginTop:8,marginBottom:16}}>Выбери одну или несколько групп → покажем упражнения</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {muscleGroups?.map(g=>{
          const sel=selGroups.has(g.id);
          return(
            <Card key={g.id} accent={sel} onClick={()=>{setSelGroups(prev=>{const n=new Set(prev);if(n.has(g.id))n.delete(g.id);else n.add(g.id);return n;}); setExSearch("");}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><span style={{fontSize:22,marginRight:12}}>{g.emoji}</span><span style={{fontSize:15,fontWeight:600,color:sel?C.accent:C.text}}>{g.name}</span></div>
                <span style={{width:22,height:22,borderRadius:6,background:sel?C.accent:C.card,border:`0.5px solid ${sel?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:sel?C.bg:C.muted,flexShrink:0}}>{sel?"✓":""}</span>
              </div>
            </Card>
          );
        })}
      </div>
      {selGroups.size>0&&(
        <div style={{marginBottom:12,fontFamily:"monospace",fontSize:11,color:C.accent}}>
          ВЫБРАНО ГРУПП: {selGroups.size} · {(muscleGroups||[]).filter(g=>selGroups.has(g.id)).map(g=>g.emoji+g.name).join(", ")}
        </div>
      )}
      <Btn accent full onClick={()=>setStep(STEP.SE)}>
        {selGroups.size===0?"ПОКАЗАТЬ ВСЕ УПРАЖНЕНИЯ →":`ПОКАЗАТЬ УПРАЖНЕНИЯ (${selGroups.size} групп) →`}
      </Btn>
    </div>
  );

  if(step===STEP.SE){
    if(replaceIdx!==null)return(
      <div style={{padding:"16px 16px 100px"}}>
        <BackBtn onBack={()=>setReplaceIdx(null)}/>
        <Kicker>ЗАМЕНА</Kicker><Hero>ВЫБЕРИ ЗАМЕНУ</Hero><div style={{height:12}}/>
        {filteredEx.slice(0,30).map(ex=><ExCard key={ex.id} ex={ex} badge={DIFF_LABEL[ex.difficulty]} onClick={()=>doReplace(replaceIdx,ex)}/>)}
      </div>
    );
    return(
      <div style={{padding:"16px 16px 100px"}}>
        <BackBtn onBack={stepBack}/>
        <Kicker>ШАГ 2 / 4</Kicker><Hero>УПРАЖНЕНИЯ</Hero>
        <input value={exSearch} onChange={e=>setExSearch(e.target.value)} placeholder="ПОИСК..." style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",outline:"none",boxSizing:"border-box",marginTop:12,marginBottom:12}}/>
        {selExs.length>0&&(
          <div style={{marginBottom:12}}>
            <Kicker>ВЫБРАНО ({selExs.length})</Kicker>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {selExs.map((e,i)=><Tag key={e.id} color={C.accent}>{i+1}. {e.name.split(" ").slice(0,2).join(" ")}</Tag>)}
            </div>
          </div>
        )}
        <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{filteredEx.length} УПРАЖНЕНИЙ</div>
        {filteredEx.slice(0,50).map(ex=>{
          const sel=selExs.find(e=>e.id===ex.id);
          return(
            <ExCard key={ex.id} ex={ex} badge={DIFF_LABEL[ex.difficulty]}
              action={
                <button onClick={ev=>{ev.stopPropagation();toggleEx(ex);}} style={{flexShrink:0,width:32,height:32,borderRadius:8,background:sel?C.accent:C.card,border:`0.5px solid ${sel?C.accent:C.border}`,color:sel?C.bg:C.muted,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {sel?`${sel.order}`:"+"}</button>}/>
          );
        })}
        {selExs.length>0&&(
          <div style={{position:"sticky",bottom:80,marginTop:12}}>
            <Btn accent full onClick={()=>setStep(STEP.WU)}>ДАЛЕЕ → РАЗМИНКА ({selExs.length})</Btn>
          </div>
        )}
      </div>
    );
  }

  if(step===STEP.WU)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={stepBack}/>
      <Kicker>ШАГ 3 / 4</Kicker><Hero>РАЗМИНКА</Hero>
      <div style={{fontSize:13,color:C.muted,marginTop:8,marginBottom:16}}>Кардио для разминки — опционально</div>
      <Btn full onClick={()=>setStep(STEP.OR)} style={{marginBottom:12}}>ПРОПУСТИТЬ</Btn>
      {cardioExs.map(ex=>(
        <ExCard key={ex.id} ex={ex}
          action={
            <button onClick={()=>setWarmup(warmup?.id===ex.id?null:ex)} style={{flexShrink:0,width:32,height:32,borderRadius:8,background:warmup?.id===ex.id?C.accent:C.card,border:`0.5px solid ${warmup?.id===ex.id?C.accent:C.border}`,color:warmup?.id===ex.id?C.bg:C.muted,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              {warmup?.id===ex.id?"✓":"+"}
            </button>}/>
      ))}
      <div style={{position:"sticky",bottom:80,marginTop:12}}>
        <Btn accent full onClick={()=>setStep(STEP.OR)}>{warmup?"✓ "+warmup.name.split(" ").slice(0,2).join(" ")+" → ПОРЯДОК":"ДАЛЕЕ БЕЗ РАЗМИНКИ"}</Btn>
      </div>
    </div>
  );

  if(step===STEP.OR)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={stepBack}/>
      <Kicker>ШАГ 4 / 4</Kicker><Hero>ПОРЯДОК</Hero>
      <div style={{fontSize:13,color:C.muted,marginTop:8,marginBottom:16}}>↑↓ — перестановка · ↔ — замена упражнения</div>
      {warmup&&<Card accent style={{marginBottom:12}}><div style={{fontSize:12,color:C.accent,fontFamily:"monospace",marginBottom:4}}>🏃 РАЗМИНКА</div><div style={{fontWeight:600,color:C.text}}>{warmup.name}</div></Card>}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {selExs.map((ex,i)=>(
          <Card key={ex.id}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <Mono color={C.accent} size={20}>{i+1}</Mono>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14,color:C.text}}>{ex.name}</div>
                <div style={{fontSize:11,color:C.muted}}>{ex.group_emoji} {ex.group_name}</div>
              </div>
              <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <button onClick={()=>setReplaceIdx(i)} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:4,color:C.muted,width:28,height:26,cursor:"pointer",fontSize:12}}>↔</button>
                <div style={{display:"flex",flexDirection:"column",gap:2}}>
                  <button onClick={()=>moveEx(i,-1)} disabled={i===0} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:3,color:C.muted,width:28,height:22,cursor:"pointer",fontSize:11}}>↑</button>
                  <button onClick={()=>moveEx(i,1)} disabled={i===selExs.length-1} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:3,color:C.muted,width:28,height:22,cursor:"pointer",fontSize:11}}>↓</button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Btn accent full onClick={startWorkout}>▶ НАЧАТЬ ТРЕНИРОВКУ</Btn>
    </div>
  );

  if(step===STEP.LG){
    // B-03: показываем экран разминки перед основными упражнениями
    if(warmup&&!warmupDone){return(
      <div style={{padding:"16px 16px 100px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <Kicker>🏃 РАЗМИНКА</Kicker>
          <button onClick={finish} style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:8,padding:"5px 10px",color:C.danger,fontSize:11,fontFamily:"monospace",cursor:"pointer"}}>ЗАВЕРШИТЬ</button>
        </div>
        {warmup.photo_url&&<img src={warmup.photo_url} alt="" style={{width:"100%",borderRadius:12,marginBottom:12,maxHeight:180,objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>}
        <Hero style={{fontSize:20,marginBottom:4}}>{warmup.name}</Hero>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Выполни разминку перед основной тренировкой</div>
        <Card accent style={{marginBottom:16,padding:"16px",textAlign:"center"}}>
          <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:8}}>РЕКОМЕНДУЕМОЕ ВРЕМЯ РАЗМИНКИ</div>
          <div style={{fontSize:32,fontFamily:"monospace",fontWeight:700,color:C.accent}}>5–10 мин</div>
        </Card>
        <Btn accent full onClick={()=>setWarmupDone(true)} style={{marginBottom:10}}>✓ РАЗМИНКА ВЫПОЛНЕНА</Btn>
        <Btn full onClick={()=>setWarmupDone(true)}>ПРОПУСТИТЬ РАЗМИНКУ</Btn>
      </div>
    );}

    const ex=selExs[curIdx];if(!ex)return null;
    const cType=cardioType(ex.name);
    const doneSets=sets[ex.id]||[];
    const setNum=doneSets.length+1;
    const totalSets=parseInt(ex.sets_recommended)||4;

    // Подсказка следующего веса (+2.5 кг от последнего подхода)
    const lastWeight=doneSets.length>0?parseFloat(doneSets[doneSets.length-1].weight||0):parseFloat(localSet.weight||0);
    const suggestWeight=lastWeight>0?Math.round((lastWeight+2.5)*4)/4:null;

    return(
      <div style={{padding:"16px 16px 100px"}}>
        {/* Хедер */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>
            {ex.group_emoji} {ex.group_name?.toUpperCase()}
          </div>
          <button onClick={finish} style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:8,padding:"5px 10px",color:C.danger,fontSize:11,fontFamily:"monospace",cursor:"pointer"}}>
            ЗАВЕРШИТЬ
          </button>
        </div>

        {/* B-07: Название + кнопка замены */}
        {lgReplaceMode?(
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <Kicker>↔ ЗАМЕНА УПРАЖНЕНИЯ</Kicker>
              <button onClick={()=>setLgReplaceMode(false)} style={{background:"none",border:`0.5px solid ${C.border}`,borderRadius:8,padding:"4px 10px",color:C.muted,fontSize:12,cursor:"pointer"}}>ОТМЕНА</button>
            </div>
            <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{ex.group_emoji} {ex.group_name} — выбери замену:</div>
            {(exercises||[]).filter(e=>e.muscle_group_id===ex.muscle_group_id&&e.id!==ex.id).slice(0,15).map(alt=>(
              <ExCard key={alt.id} ex={alt} badge={DIFF_LABEL[alt.difficulty]}
                onClick={()=>{
                  setSelExs(prev=>prev.map((e2,i)=>i===curIdx?{...alt,order:e2.order}:e2));
                  setSets(prev=>{const n={...prev};if(!n[alt.id])n[alt.id]=[];return n;});
                  setLgReplaceMode(false);
                }}
                action={
                  <button
                    onClick={ev=>{ev.stopPropagation();
                      setSelExs(prev=>prev.map((e2,i)=>i===curIdx?{...alt,order:e2.order}:e2));
                      setSets(prev=>{const n={...prev};if(!n[alt.id])n[alt.id]=[];return n;});
                      setLgReplaceMode(false);
                    }}
                    style={{flexShrink:0,background:C.accent,border:"none",borderRadius:8,
                      padding:"6px 10px",color:C.bg,fontSize:11,fontWeight:700,cursor:"pointer"}}>
                    ЗАМЕНИТЬ
                  </button>
                }
              />
            ))}
          </div>
        ):(
          <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <Hero style={{fontSize:22,flex:1}}>{ex.name}</Hero>
              <button onClick={()=>setLgReplaceMode(true)} style={{background:"rgba(200,255,0,0.15)",border:`0.5px solid ${C.accent}`,borderRadius:8,padding:"6px 12px",color:C.accent,fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0,marginLeft:8,fontFamily:"monospace"}}>↔ ЗАМЕНИТЬ</button>
            </div>
            <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:12}}>
              ПОДХОД {setNum} / {totalSets}
              {doneSets.length>0&&<span style={{color:C.success,marginLeft:8}}>✓ {doneSets.length} выполнено</span>}
            </div>
          </>
        )}

        {/* Основной блок ввода — скрываем при режиме замены */}
        {!lgReplaceMode&&cType===null&&(
          <Card accent style={{marginBottom:12,padding:"16px"}}>
            <div style={{display:"flex",gap:16,alignItems:"flex-end",justifyContent:"center"}}>

              {/* Вес */}
              <div style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ВЕС (КГ)</div>
                <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                  <button onClick={()=>setLocalSet(p=>({...p,weight:String(Math.max(0,parseFloat(p.weight||0)-2.5))}))}
                    style={{width:36,height:36,borderRadius:8,background:C.card,border:`0.5px solid ${C.border}`,color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0}}>−</button>
                  <input type="number" value={localSet.weight} onChange={e=>setLocalSet(p=>({...p,weight:e.target.value}))} placeholder="0"
                    style={{background:"none",border:"none",color:C.accent,fontSize:32,fontFamily:"monospace",fontWeight:700,width:80,outline:"none",textAlign:"center"}}/>
                  <button onClick={()=>setLocalSet(p=>({...p,weight:String(parseFloat(p.weight||0)+2.5)}))}
                    style={{width:36,height:36,borderRadius:8,background:C.card,border:`0.5px solid ${C.border}`,color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0}}>+</button>
                </div>
                {suggestWeight&&doneSets.length===0&&(
                  <div style={{fontSize:11,color:C.muted,marginTop:4,fontFamily:"monospace"}}>
                    <button onClick={()=>setLocalSet(p=>({...p,weight:String(suggestWeight)}))}
                      style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:11,fontFamily:"monospace",textDecoration:"underline"}}>
                      → {suggestWeight} кг
                    </button>
                  </div>
                )}
              </div>

              <div style={{width:1,height:60,background:C.border,flexShrink:0}}/>

              {/* Повторения */}
              <div style={{textAlign:"center",flex:1}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ПОВТОРЕНИЙ</div>
                <div style={{display:"flex",alignItems:"center",gap:8,justifyContent:"center"}}>
                  <button onClick={()=>setLocalSet(p=>({...p,reps:String(Math.max(1,parseInt(p.reps||0)-1))}))}
                    style={{width:36,height:36,borderRadius:8,background:C.card,border:`0.5px solid ${C.border}`,color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0}}>−</button>
                  <input type="number" value={localSet.reps} onChange={e=>setLocalSet(p=>({...p,reps:e.target.value}))} placeholder="0"
                    style={{background:"none",border:"none",color:C.accent,fontSize:32,fontFamily:"monospace",fontWeight:700,width:60,outline:"none",textAlign:"center"}}/>
                  <button onClick={()=>setLocalSet(p=>({...p,reps:String(parseInt(p.reps||0)+1)}))}
                    style={{width:36,height:36,borderRadius:8,background:C.card,border:`0.5px solid ${C.border}`,color:C.muted,fontSize:16,cursor:"pointer",flexShrink:0}}>+</button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Кардио: время */}
        {!lgReplaceMode&&cType==="time"&&(
          <Card accent style={{marginBottom:12,padding:"16px",textAlign:"center"}}>
            <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ВРЕМЯ (СЕК)</div>
            <input type="number" value={localSet.time} onChange={e=>setLocalSet(p=>({...p,time:e.target.value}))} placeholder="0"
              style={{background:"none",border:"none",color:C.accent,fontSize:40,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none",textAlign:"center"}}/>
          </Card>
        )}

        {/* Кардио: дистанция */}
        {!lgReplaceMode&&cType==="distance"&&(
          <Card accent style={{marginBottom:12,padding:"16px"}}>
            <div style={{display:"flex",gap:16}}>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ВРЕМЯ (МИН)</div>
                <input type="number" value={localSet.time} onChange={e=>setLocalSet(p=>({...p,time:e.target.value}))} placeholder="0"
                  style={{background:"none",border:"none",color:C.accent,fontSize:32,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none",textAlign:"center"}}/>
              </div>
              <div style={{width:1,background:C.border}}/>
              <div style={{flex:1,textAlign:"center"}}>
                <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ДИСТ. (КМ)</div>
                <input type="number" step="0.1" value={localSet.distance} onChange={e=>setLocalSet(p=>({...p,distance:e.target.value}))} placeholder="0"
                  style={{background:"none",border:"none",color:C.accent,fontSize:32,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none",textAlign:"center"}}/>
              </div>
            </div>
          </Card>
        )}

        {/* История подходов */}
        {doneSets.length>0&&(
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            {doneSets.map((s,i)=>(
              <div key={i} style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"6px 10px",textAlign:"center",minWidth:60}}>
                <div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>ПХ {i+1}</div>
                <div style={{fontSize:12,color:C.success,fontFamily:"monospace",fontWeight:700,marginTop:2}}>
                  {cType==="distance"?`${s.distance}км`:cType==="time"?`${s.time}с`:`${s.weight}×${s.reps}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Главная кнопка */}
        <button onClick={async()=>{
          if(logBusy)return;
          setLogBusy(true);
          try{
            await doLog();
            setShowTimer(true);
            setLocalSet({reps:"",weight:"",time:"",distance:""});
          }finally{setLogBusy(false);}
        }}
          disabled={logBusy}
          style={{width:"100%",background:logBusy?"#8FB300":C.accent,border:"none",borderRadius:12,padding:"16px",color:C.bg,fontWeight:700,fontSize:16,cursor:logBusy?"not-allowed":"pointer",marginBottom:10,letterSpacing:0.5,opacity:logBusy?0.8:1,transition:"all 0.15s"}}>
          {logBusy?"⏳ СОХРАНЯЕМ...":"✓ ПОДХОД ВЫПОЛНЕН"}
        </button>

        {/* Навигация между упражнениями */}
        <div style={{display:"flex",gap:10,marginBottom:10}}>
          <Btn full onClick={()=>setCurIdx(i=>Math.max(0,i-1))} disabled={curIdx===0} style={{flex:1}}>← ПРЕД</Btn>
          <Btn full onClick={()=>setCurIdx(i=>Math.min(selExs.length-1,i+1))} disabled={curIdx===selExs.length-1} style={{flex:1}}>СЛЕД →</Btn>
        </div>

        {/* Точки-индикаторы */}
        <div style={{display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
          {selExs.map((e,i)=>(
            <button key={e.id} onClick={()=>setCurIdx(i)}
              style={{width:28,height:28,borderRadius:8,background:i===curIdx?C.accent:C.card,border:`0.5px solid ${i===curIdx?C.accent:C.border}`,color:i===curIdx?C.bg:C.muted,fontSize:11,fontFamily:"monospace",cursor:"pointer"}}>
              {i+1}
            </button>
          ))}
        </div>

        {/* Таймер отдыха */}
        {showTimer&&<RestTimer onClose={()=>setShowTimer(false)}/>}
      </div>
    );
  }
  return null;
}


// ─── MY WORKOUTS DETAIL ───────────────────────────────────────────────────────
function MyWorkoutsDetailScreen({tgId,onBack,onNav}){
  const [data,setData]=useState(null);
  const [deleting,setDeleting]=useState(null);
  function load(){
    if(!tgId){setData({planned:[],archive:[]});return;}
    fetch(`${API}/planned/${tgId}`).then(r=>r.json()).then(setData).catch(()=>setData({planned:[],archive:[]}));
  }
  useEffect(()=>{load();},[]);
  async function del(id){setDeleting(id);try{await fetch(`${API}/planned/${tgId}/${id}`,{method:"DELETE"});load();}catch{}finally{setDeleting(null);};}
  const fmtDt=iso=>{if(!iso)return"—";const d=new Date(iso);return d.toLocaleString("ru",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});};
  const statusColor={scheduled:C.accent,reminded:C.warn,completed:C.success,missed:C.danger};
  if(!data)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader/></div>;
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>РАСПИСАНИЕ</Kicker><Hero>МОИ ТРЕНИРОВКИ</Hero>
    <div style={{height:16}}/>
    <Kicker>ПРЕДСТОЯЩИЕ</Kicker>
    {data.planned.length===0?<Card style={{marginBottom:16}}><div style={{textAlign:"center",padding:"12px 0",color:C.muted,fontSize:14}}>Нет запланированных тренировок</div></Card>:
    <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
      {data.planned.map(pw=><Card key={pw.id} onClick={()=>onNav("planned_detail",{pwId:pw.id})}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:14,color:C.text}}>{pw.title}</div>
            <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginTop:3}}>{fmtDt(pw.planned_datetime)}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:11,fontFamily:"monospace",color:statusColor[pw.status]||C.muted}}>{pw.status?.toUpperCase()}</span>
            <button onClick={e=>{e.stopPropagation();del(pw.id);}} disabled={deleting===pw.id} style={{background:"none",border:`0.5px solid ${C.danger}`,borderRadius:6,padding:"3px 8px",color:C.danger,fontSize:11,cursor:"pointer"}}>{deleting===pw.id?"...":"✗"}</button>
          </div>
        </div>
        <div style={{marginTop:8,fontSize:11,color:C.accent,fontFamily:"monospace"}}>ОТКРЫТЬ СОСТАВ →</div>
      </Card>)}
    </div>}
    {data.archive.length>0&&<><Kicker>АРХИВ</Kicker><div style={{display:"flex",flexDirection:"column",gap:8}}>
      {data.archive.map(pw=><Card key={pw.id} onClick={()=>onNav("planned_detail",{pwId:pw.id})} style={{opacity:0.7}}>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <div><div style={{fontWeight:600,fontSize:14,color:C.muted}}>{pw.title}</div><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginTop:2}}>{fmtDt(pw.planned_datetime)}</div></div>
          <span style={{fontSize:11,fontFamily:"monospace",color:statusColor[pw.status]||C.muted}}>{pw.status?.toUpperCase()}</span>
        </div>
      </Card>)}
    </div></>}
  </div>;
}

// ─── PLANNED DETAIL ───────────────────────────────────────────────────────────
function PlannedDetailScreen({pwId,tgId,onBack,exercises,readOnly=false,onNav}){
  const [data,setData]=useState(null);
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState({title:"",date:"",time:""});
  const [saving,setSaving]=useState(false);

  useEffect(()=>{
    if(!pwId||!tgId){setData({exercises:[],title:"—",status:"error"});return;}
    fetch(`${API}/planned/${tgId}/${pwId}`)
      .then(r=>{if(!r.ok)throw new Error(r.status);return r.json();})
      .then(d=>{
        setData(d);
        if(d.planned_datetime){
          const dt=new Date(d.planned_datetime);
          setForm({title:d.title||"",date:dt.toISOString().split("T")[0],time:dt.toTimeString().slice(0,5)});
        }
      })
      .catch(()=>setData({exercises:[],title:"Не удалось загрузить",status:"error"}));
  },[pwId]);

  async function save(){
    setSaving(true);
    try{
      const body={title:form.title,planned_datetime:`${form.date}T${form.time}:00`};
      await fetch(`${API}/planned/${tgId}/${pwId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const updated=await fetch(`${API}/planned/${tgId}/${pwId}`).then(r=>r.json());
      setData(updated);setEditing(false);
    }catch{}finally{setSaving(false);}
  }

  if(!data)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader/></div>;
  const dt=data.planned_datetime?new Date(data.planned_datetime).toLocaleString("ru",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}):"—";

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>ЗАПЛАНИРОВАННАЯ ТРЕНИРОВКА</Kicker>
    {!editing?<>
      <Hero>{data.title||"Тренировка"}</Hero>
      <div style={{fontSize:13,color:C.accent,fontFamily:"monospace",marginTop:6,marginBottom:16}}>📅 {dt}</div>
      {!readOnly&&data?.status==="scheduled"&&<>
        <Btn accent full onClick={()=>onNav&&onNav("active_workout",{
          preselectedExIds: data.exercises?.map(e=>e.id)||[]
        })} style={{marginBottom:10}}>▶ НАЧАТЬ ТРЕНИРОВКУ</Btn>
        <Btn full onClick={()=>setEditing(true)} style={{marginBottom:16}}>✏ ИЗМЕНИТЬ ДАТУ/СОСТАВ</Btn>
      </>}
      {readOnly&&<Card style={{marginBottom:12,background:"#FF444411",border:`0.5px solid ${C.danger}`}}><div style={{fontSize:13,color:C.danger,fontFamily:"monospace"}}>📋 АРХИВНАЯ · {(data.status||"missed").toUpperCase()} · ТОЛЬКО ПРОСМОТР</div></Card>}
      {data.exercises?.length===0?<Card><div style={{textAlign:"center",padding:"16px 0",color:C.muted}}>{readOnly?"Упражнения не были запланированы":"Упражнения не выбраны"}</div></Card>:
      <><Kicker>УПРАЖНЕНИЯ ({data.exercises?.length})</Kicker>
      {data.exercises?.map(ex=><Card key={ex.id} style={{marginBottom:8}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
          <Mono color={C.accent} size={20}>{ex.order}</Mono>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,fontSize:14,color:C.text}}>{ex.name}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{ex.group_emoji} {ex.group_name}</div>
            <div style={{display:"flex",gap:10,marginTop:6}}>
              <Tag color={DIFF_COLOR[ex.difficulty]||C.muted}>{DIFF_LABEL[ex.difficulty]}</Tag>
              <span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{ex.sets_recommended}×{ex.reps_recommended}</span>
            </div>
            {ex.description&&<div style={{fontSize:12,color:C.muted,marginTop:6,lineHeight:1.5}}>{ex.description}</div>}
          </div>
        </div>
      </Card>)}</>}
    </>:<>
      <Hero>ИЗМЕНИТЬ</Hero>
      <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16,marginBottom:16}}>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>НАЗВАНИЕ</div><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={{background:"none",border:"none",color:C.text,fontSize:16,width:"100%",outline:"none"}}/></Card>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ДАТА</div><div style={{display:"flex",alignItems:"center",gap:8}}><input type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{colorScheme:"dark",background:"none",border:"none",color:C.accent,fontSize:18,fontFamily:"monospace",fontWeight:700,outline:"none",flex:1,WebkitAppearance:"none",appearance:"none"}}/><span style={{fontSize:20,cursor:"pointer",flexShrink:0}} onClick={()=>{const el=document.querySelector('input[type="date"]');el&&el.showPicker&&el.showPicker();}}>📅</span></div></Card>
        <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ВРЕМЯ</div><div style={{display:"flex",alignItems:"center",gap:8}}><input type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={{colorScheme:"dark",background:"none",border:"none",color:C.accent,fontSize:18,fontFamily:"monospace",fontWeight:700,outline:"none",flex:1,WebkitAppearance:"none",appearance:"none"}}/><span style={{fontSize:20,cursor:"pointer",flexShrink:0}} onClick={()=>{const el=document.querySelector('input[type="time"]');el&&el.showPicker&&el.showPicker();}}>⏰</span></div></Card>
      </div>
      <div style={{display:"flex",gap:10}}><Btn full onClick={()=>setEditing(false)} style={{flex:1}}>ОТМЕНА</Btn><Btn accent full onClick={save} disabled={saving} style={{flex:2}}>{saving?"...":"СОХРАНИТЬ"}</Btn></div>
    </>}
  </div>;
}

// ─── PLAN WORKOUT ─────────────────────────────────────────────────────────────
function PlanWorkoutScreen({tgId,exercises,muscleGroups,onBack}){
  const [step,setStep]=useState(0); // 0=group, 1=exercises, 2=datetime
  const [selGroups,setSelGroups]=useState(new Set()); // мультивыбор групп
  const [selExs,setSelExs]=useState([]);
  const [form,setForm]=useState({title:"",date:"",time:"10:00"});
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [search,setSearch]=useState("");
  const [viewEx,setViewEx]=useState(null); // просмотр карточки

  const filtered=(exercises||[]).filter(e=>(selGroups.size===0||selGroups.has(e.muscle_group_id))&&(!search||e.name.toLowerCase().includes(search.toLowerCase())));
  const toggle=ex=>setSelExs(prev=>prev.find(e=>e.id===ex.id)?prev.filter(e=>e.id!==ex.id):[...prev,ex]);

  async function save(){
    if(!form.date||!form.time)return;
    setSaving(true);
    try{
      // Проверяем конфликт времени
      const planDt=new Date(`${form.date}T${form.time}:00`);
      const planned=await fetch(`${API}/planned/${tgId}`).then(r=>r.json()).catch(()=>({planned:[]}));
      const conflict=(planned.planned||[]).find(pw=>{
        const pwDt=new Date(pw.planned_datetime);
        return Math.abs(planDt-pwDt)<60*60*1000; // ±1 час
      });
      if(conflict){
        const ok=window.confirm(`На ${planDt.toLocaleString("ru",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})} уже есть тренировка "${conflict.title}". Выбрать другое время?`);
        if(ok){setSaving(false);return;}
      }
      const title=form.title||selExs.slice(0,2).map(e=>e.name.split(" ")[0]).join("+")||"Тренировка";
      const res=await fetch(`${API}/planned/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,planned_datetime:`${form.date}T${form.time}:00`,exercise_ids:selExs.map(e=>e.id)})});
      if(res.ok)setSaved(true);
    }catch{}finally{setSaving(false);}
  }

  if(saved)return <div style={{padding:"16px 16px 100px"}}>
    <div style={{textAlign:"center",paddingTop:60}}>
      <div style={{fontSize:48,color:C.accent}}>📅</div>
      <Hero style={{textAlign:"center",marginTop:16}}>ЗАПЛАНИРОВАНО</Hero>
      <div style={{color:C.muted,marginTop:8,fontFamily:"monospace"}}>Бот напомнит за 1 час</div>
      <Btn accent full onClick={onBack} style={{marginTop:32}}>← НАЗАД</Btn>
    </div>
  </div>;

  if(step===0)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={onBack}/>
      <Kicker>ПЛАНИРОВАНИЕ · ШАГ 1</Kicker><Hero>ГРУППЫ МЫШЦ</Hero>
      <div style={{fontSize:13,color:C.muted,marginTop:8,marginBottom:16}}>Выбери одну или несколько групп</div>
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
        {muscleGroups?.map(g=>{
          const sel=selGroups.has(g.id);
          return(
            <Card key={g.id} accent={sel} onClick={()=>setSelGroups(p=>{const n=new Set(p);if(n.has(g.id))n.delete(g.id);else n.add(g.id);return n;})}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><span style={{fontSize:22,marginRight:12}}>{g.emoji}</span><span style={{fontSize:15,fontWeight:600,color:sel?C.accent:C.text}}>{g.name}</span></div>
                <span style={{width:22,height:22,borderRadius:6,background:sel?C.accent:C.card,border:`0.5px solid ${sel?C.accent:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:sel?C.bg:C.muted,flexShrink:0}}>{sel?"✓":""}</span>
              </div>
            </Card>
          );
        })}
      </div>
      {selGroups.size>0&&<div style={{marginBottom:10,fontSize:11,color:C.accent,fontFamily:"monospace"}}>ВЫБРАНО: {(muscleGroups||[]).filter(g=>selGroups.has(g.id)).map(g=>g.emoji+g.name).join(", ")}</div>}
      <Btn accent full onClick={()=>setStep(1)}>{selGroups.size===0?"ВСЕ УПРАЖНЕНИЯ →":`УПРАЖНЕНИЯ (${selGroups.size} групп) →`}</Btn>
    </div>
  );

  // Просмотр карточки упражнения
  if(step===1&&viewEx)return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={()=>setViewEx(null)}/>
      {viewEx.photo_url&&<img src={viewEx.photo_url} alt={viewEx.name} style={{width:"100%",borderRadius:12,marginBottom:14,objectFit:"cover",maxHeight:220}} onError={e=>e.target.style.display="none"}/>}
      <Kicker>{viewEx.group_emoji} {viewEx.group_name?.toUpperCase()}</Kicker>
      <Hero style={{fontSize:20}}>{viewEx.name}</Hero>
      <div style={{height:12}}/>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[{l:"ПОДХОДОВ",v:viewEx.sets_recommended},{l:"ПОВТОРЕНИЙ",v:viewEx.reps_recommended},{l:"СЛОЖНОСТЬ",v:DIFF_LABEL[viewEx.difficulty]||viewEx.difficulty}].map((s,i)=>(
          <Card key={i} style={{flex:1,textAlign:"center"}}>
            <div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div>
            <div style={{fontSize:14,fontWeight:700,color:C.accent}}>{s.v||"—"}</div>
          </Card>
        ))}
      </div>
      {viewEx.description&&<Card style={{marginBottom:10}}><Kicker>ОПИСАНИЕ</Kicker><div style={{fontSize:14,color:C.text,lineHeight:1.6,marginTop:6}}>{viewEx.description}</div></Card>}
      {viewEx.equipment&&<Card style={{marginBottom:14}}><Kicker>ОБОРУДОВАНИЕ</Kicker><div style={{fontSize:14,color:C.text,marginTop:4}}>{viewEx.equipment}</div></Card>}
      <div style={{display:"flex",gap:10}}>
        <Btn full onClick={()=>setViewEx(null)} style={{flex:1}}>← НАЗАД</Btn>
        <Btn accent full onClick={()=>{
          setSelExs(prev=>prev.find(e=>e.id===viewEx.id)?prev.filter(e=>e.id!==viewEx.id):[...prev,viewEx]);
          setViewEx(null);
        }} style={{flex:2}}>
          {selExs.find(e=>e.id===viewEx.id)?"✓ УБРАТЬ ИЗ ТРЕНИРОВКИ":"+ ДОБАВИТЬ В ТРЕНИРОВКУ"}
        </Btn>
      </div>
    </div>
  );

  if(step===1)return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={()=>setStep(0)}/><Kicker>ПЛАНИРОВАНИЕ · ШАГ 2</Kicker><Hero>УПРАЖНЕНИЯ</Hero>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ПОИСК..." style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",outline:"none",boxSizing:"border-box",marginTop:12,marginBottom:12}}/>
    {selExs.length>0&&<div style={{marginBottom:12}}><Kicker>ВЫБРАНО ({selExs.length})</Kicker><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{selExs.map((e,i)=><Tag key={e.id} color={C.accent}>{i+1}. {e.name.split(" ").slice(0,2).join(" ")}</Tag>)}</div></div>}
    {filtered.slice(0,50).map(ex=>{const sel=selExs.find(e=>e.id===ex.id);return<ExCard key={ex.id} ex={ex} badge={DIFF_LABEL[ex.difficulty]}
      onClick={()=>setViewEx(ex)}
      action={<button onClick={e=>{e.stopPropagation();toggle(ex);}} style={{flexShrink:0,width:32,height:32,borderRadius:8,background:sel?C.accent:C.card,border:`0.5px solid ${sel?C.accent:C.border}`,color:sel?C.bg:C.muted,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{sel?`${selExs.indexOf(sel)+1}`:"+"}</button>}/>;
    })}
    {selExs.length>0&&<div style={{position:"sticky",bottom:80,marginTop:12}}><Btn accent full onClick={()=>setStep(2)}>ДАЛЕЕ → ДАТА И ВРЕМЯ</Btn></div>}
  </div>;

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={()=>setStep(1)}/><Kicker>ПЛАНИРОВАНИЕ · ШАГ 3</Kicker><Hero>ДАТА И ВРЕМЯ</Hero>
    <div style={{height:16}}/>
    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
      <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>НАЗВАНИЕ (ОПЦИОНАЛЬНО)</div><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder={selExs.slice(0,2).map(e=>e.name.split(" ")[0]).join("+")||"Моя тренировка"} style={{background:"none",border:"none",color:C.text,fontSize:16,width:"100%",outline:"none"}}/></Card>
      <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ДАТА</div><div style={{display:"flex",alignItems:"center",gap:8}}><input id="plan-date-input" type="date" value={form.date} min={new Date().toISOString().split("T")[0]} onChange={e=>setForm(p=>({...p,date:e.target.value}))} style={{colorScheme:"dark",background:"none",border:"none",color:C.accent,fontSize:20,fontFamily:"monospace",fontWeight:700,outline:"none",flex:1,WebkitAppearance:"none",appearance:"none"}}/><span style={{fontSize:22,cursor:"pointer",flexShrink:0}} onClick={()=>{const el=document.getElementById("plan-date-input");el&&(el.showPicker?el.showPicker():el.click());}}>📅</span></div></Card>
      <Card><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ВРЕМЯ</div><div style={{display:"flex",alignItems:"center",gap:8}}><input id="plan-time-input" type="time" value={form.time} onChange={e=>setForm(p=>({...p,time:e.target.value}))} style={{colorScheme:"dark",background:"none",border:"none",color:C.accent,fontSize:20,fontFamily:"monospace",fontWeight:700,outline:"none",flex:1,WebkitAppearance:"none",appearance:"none"}}/><span style={{fontSize:22,cursor:"pointer",flexShrink:0}} onClick={()=>{const el=document.getElementById("plan-time-input");el&&(el.showPicker?el.showPicker():el.click());}}>⏰</span></div></Card>
    </div>
    <div style={{marginBottom:16}}><Kicker>УПРАЖНЕНИЯ ({selExs.length})</Kicker>{selExs.map((e,i)=><div key={e.id} style={{padding:"6px 0",borderBottom:`0.5px solid ${C.border}`,display:"flex",gap:10}}><Mono color={C.accent} size={13}>{i+1}</Mono><span style={{fontSize:13,color:C.text}}>{e.name}</span></div>)}</div>
    <Btn accent full onClick={save} disabled={saving||!form.date}>{saving?"СОХРАНЯЕМ...":"📅 ЗАПЛАНИРОВАТЬ"}</Btn>
    <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",textAlign:"center",marginTop:8}}>Бот напомнит за 1 час до тренировки</div>
  </div>;
}

// ─── STANDALONE TIMER (из меню) ──────────────────────────────────────────────
function StandaloneTimer({onBack}){
  return(
    <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={onBack}/>
      <Kicker>ИНСТРУМЕНТЫ</Kicker>
      <Hero>ТАЙМЕР ОТДЫХА</Hero>
      <div style={{height:16}}/>
      <Card>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.6,marginBottom:12}}>
          Таймер автоматически запускается после каждого подхода во время тренировки.<br/>
          Здесь можно использовать отдельно.
        </div>
      </Card>
      <div style={{marginTop:16,position:"relative"}}>
        <RestTimer onClose={onBack} standalone/>
      </div>
    </div>
  );
}

// ─── WEIGHT CHART ─────────────────────────────────────────────────────────────
function WeightChart({logs}){
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(()=>{
    if(!logs||logs.length<2||!canvasRef.current)return;

    // Уничтожаем предыдущий график
    if(chartRef.current){chartRef.current.destroy();}

    const sorted = [...logs].sort((a,b)=>new Date(a.logged_at)-new Date(b.logged_at)).slice(-30);
    const labels = sorted.map(w=>{
      const d=new Date(w.logged_at);
      return d.toLocaleDateString("ru",{day:"numeric",month:"short"});
    });
    const data = sorted.map(w=>parseFloat(w.weight)||0);
    const minW = Math.min(...data)-1;
    const maxW = Math.max(...data)+1;

    chartRef.current = new window.Chart(canvasRef.current,{
      type:"line",
      data:{
        labels,
        datasets:[{
          label:"Вес (кг)",
          data,
          borderColor:"#C8FF00",
          backgroundColor:"rgba(200,255,0,0.08)",
          borderWidth:2,
          pointBackgroundColor:"#C8FF00",
          pointRadius:4,
          pointHoverRadius:6,
          fill:true,
          tension:0.3,
        }]
      },
      options:{
        responsive:true,
        maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{
            backgroundColor:"#222222",
            titleColor:"#888888",
            bodyColor:"#C8FF00",
            borderColor:"#2A2A2A",
            borderWidth:1,
          }
        },
        scales:{
          x:{
            ticks:{color:"#888888",font:{size:10},maxRotation:45},
            grid:{color:"rgba(255,255,255,0.05)"},
          },
          y:{
            min:minW,max:maxW,
            ticks:{color:"#888888",font:{size:10},callback:v=>`${v} кг`},
            grid:{color:"rgba(255,255,255,0.05)"},
          }
        }
      }
    });

    return()=>{if(chartRef.current)chartRef.current.destroy();};
  },[logs]);

  // Загружаем Chart.js если нет
  useEffect(()=>{
    if(window.Chart)return;
    const script=document.createElement("script");
    script.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload=()=>{if(canvasRef.current&&logs?.length>=2){/* перерисует useEffect выше */}};
    document.head.appendChild(script);
  },[]);

  const sorted=[...logs].sort((a,b)=>new Date(a.logged_at)-new Date(b.logged_at));
  const first=parseFloat(sorted[0]?.weight||0);
  const last=parseFloat(sorted[sorted.length-1]?.weight||0);
  const delta=Math.round((last-first)*10)/10;

  return(
    <Card style={{marginTop:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <Kicker>ДИНАМИКА ВЕСА</Kicker>
        <div style={{textAlign:"right"}}>
          <Mono size={16}>{last} кг</Mono>
          {delta!==0&&<div style={{fontSize:11,fontFamily:"monospace",color:delta<0?C.success:C.danger,marginTop:2}}>
            {delta>0?"+":""}{delta} кг за период
          </div>}
        </div>
      </div>
      <div style={{position:"relative",height:160}}>
        <canvas ref={canvasRef} role="img" aria-label={`График веса: от ${first} до ${last} кг`}/>
      </div>
    </Card>
  );
}

// ─── PROGRESS ─────────────────────────────────────────────────────────────────
function ProgressScreen({stats}){
  if(!stats)return <div style={{padding:"16px 16px 100px"}}><Loader text="ПРОГРЕСС"/></div>;
  const weekly=stats.weekly_workouts||[];const peak=Math.max(...weekly,1);
  const blocks=" ▁▂▃▄▅▆▇█";const spark=weekly.map(v=>blocks[Math.min(8,Math.round(8*v/peak))]).join("");
  return <div style={{padding:"16px 16px 100px"}}>
    <Kicker>{stats.period_days||30} ДНЕЙ</Kicker><Hero>{stats.period_days||30} ДНЕЙ ОГНЯ</Hero>
    <div style={{height:16}}/>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
      {[{l:"ТРЕНИРОВОК",v:stats.total_workouts||0},{l:"ПОДХОДОВ",v:stats.total_sets||0},{l:"ТОННАЖ",v:`${Math.round((stats.total_volume||0)/1000*10)/10} т`},{l:"СЕРИЯ",v:`${stats.streak_days||0} дн`}].map((s,i)=><Card key={i}><div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div><Mono>{s.v}</Mono></Card>)}
    </div>
    {weekly.length>0&&<Card style={{marginBottom:16}}><Kicker>ПО НЕДЕЛЯМ</Kicker><div style={{fontFamily:"monospace",fontSize:22,color:C.accent,letterSpacing:2,margin:"8px 0"}}>{spark||"нет данных"}</div><div style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>тренировок в неделю</div></Card>}
    {stats.weight_logs?.length>0&&<WeightChart logs={stats.weight_logs}/>}
  </div>;
}

// ─── CATALOG ──────────────────────────────────────────────────────────────────
function CatalogScreen({exercises,muscleGroups}){
  const [activeGroup,setActiveGroup]=useState(null);
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(null);
  const filtered=(exercises||[]).filter(e=>(!activeGroup||e.muscle_group_id===activeGroup)&&(!search||e.name.toLowerCase().includes(search.toLowerCase())));

  if(selected)return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={()=>setSelected(null)}/>
    {selected.photo_url&&<img src={selected.photo_url} alt={selected.name} style={{width:"100%",borderRadius:12,marginBottom:14,objectFit:"cover",maxHeight:220}} onError={e=>e.target.style.display="none"}/>}
    <Kicker>{selected.group_emoji} {selected.group_name?.toUpperCase()}</Kicker><Hero>{selected.name}</Hero>
    <div style={{height:12}}/>
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      {[{l:"ПОДХОДОВ",v:selected.sets_recommended},{l:"ПОВТОРЕНИЙ",v:selected.reps_recommended},{l:"СЛОЖНОСТЬ",v:DIFF_LABEL[selected.difficulty]||selected.difficulty}].map((s,i)=><Card key={i} style={{flex:1,textAlign:"center"}}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>{s.l}</div><div style={{fontSize:14,fontWeight:700,color:C.accent}}>{s.v||"—"}</div></Card>)}
    </div>
    {selected.description&&<Card style={{marginBottom:10}}><Kicker>ОПИСАНИЕ</Kicker><div style={{fontSize:14,color:C.text,lineHeight:1.6,marginTop:6}}>{selected.description}</div></Card>}
    {selected.equipment&&<Card><Kicker>ОБОРУДОВАНИЕ</Kicker><div style={{fontSize:14,color:C.text,marginTop:4}}>{selected.equipment}</div></Card>}
  </div>;

  return <div style={{padding:"16px 16px 100px"}}>
    <Kicker>БАЗА ЗНАНИЙ</Kicker><Hero>УПРАЖНЕНИЯ</Hero>
    <div style={{height:12}}/>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ПОИСК..." style={{width:"100%",background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",letterSpacing:1,boxSizing:"border-box",marginBottom:12,outline:"none"}}/>
    <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:8,marginBottom:12}}>
      <button onClick={()=>setActiveGroup(null)} style={{flexShrink:0,padding:"6px 12px",borderRadius:20,background:!activeGroup?C.accent:C.card,color:!activeGroup?C.bg:C.muted,border:`0.5px solid ${!activeGroup?C.accent:C.border}`,fontSize:11,fontFamily:"monospace",cursor:"pointer",fontWeight:700}}>ВСЕ</button>
      {muscleGroups?.map(g=><button key={g.id} onClick={()=>setActiveGroup(g.id===activeGroup?null:g.id)} style={{flexShrink:0,padding:"6px 12px",borderRadius:20,background:activeGroup===g.id?C.accent:C.card,color:activeGroup===g.id?C.bg:C.muted,border:`0.5px solid ${activeGroup===g.id?C.accent:C.border}`,fontSize:11,fontFamily:"monospace",cursor:"pointer"}}>{g.emoji} {g.name.toUpperCase()}</button>)}
    </div>
    <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>{filtered.length} УПРАЖНЕНИЙ</div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {filtered.slice(0,60).map(ex=>(
        <Card key={ex.id} onClick={()=>setSelected(ex)} style={{marginBottom:0}}>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            {ex.photo_url&&<img src={ex.photo_url} alt="" style={{width:56,height:56,borderRadius:8,objectFit:"cover",flexShrink:0}} onError={e=>e.target.style.display="none"}/>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                <div style={{fontWeight:600,fontSize:14,color:C.text,lineHeight:1.3}}>{ex.name}</div>
                <Tag color={DIFF_COLOR[ex.difficulty]||C.muted}>{DIFF_LABEL[ex.difficulty]}</Tag>
              </div>
              <div style={{fontSize:11,color:C.muted,marginTop:3}}>{ex.group_emoji} {ex.group_name}</div>
              <div style={{display:"flex",gap:10,marginTop:6,alignItems:"center"}}>
                <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.sets_recommended} подх</span>
                <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.reps_recommended} повт</span>
                {ex.equipment&&<span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{ex.equipment}</span>}
                <span style={{fontSize:10,color:C.accent,fontFamily:"monospace",marginLeft:"auto"}}>ПОДРОБНЕЕ →</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  </div>;
}

// ─── AI ───────────────────────────────────────────────────────────────────────
function AIScreen({user,tgId,onNav,exercises=[]}){
  const [q,setQ]=useState("");
  const [answer,setAnswer]=useState(null);
  const [workoutPlan,setWorkoutPlan]=useState(null);
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const requestsLeft=5-(user?.ai_requests_today||0);
  const suggs=["Составь план тренировки на неделю под набор массы","Что есть до и после тренировки","Программа для похудения на месяц","Тренировка на плечи и руки"];

  async function ask(question){
    if(!question.trim()||loading)return;
    setLoading(true);setAnswer(null);setWorkoutPlan(null);setSaved(false);setQ("");
    try{
      const res=await fetch(`${API}/ai/ask`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({question,tg_id:tgId})});
      if(res.status===429){setAnswer("Дневной лимит запросов исчерпан. Попробуй завтра.");return;}
      if(!res.ok){
        const err=await res.text().catch(()=>"");
        setAnswer(`Ошибка сервера (${res.status})${err?" — "+err.slice(0,100):""}. Попробуй позже.`);
        return;
      }
      const d=await res.json();
      setAnswer(d.answer||"Нет ответа");
      if(d.workout_plan)setWorkoutPlan(d.workout_plan);
    }catch(e){setAnswer("Ошибка соединения — "+e.message);}
    finally{setLoading(false);}
  }

  async function saveWorkoutPlan(){
    if(!workoutPlan||!tgId)return;
    setSaving(true);
    try{
      // Конвертируем названия упражнений в ID из каталога
      const exNames = workoutPlan.exercises||[];
      const exIds = exNames.map(name=>{
        const found = (exercises||[]).find(e=>
          e.name.toLowerCase().trim()===name.toLowerCase().trim()
        );
        return found?.id||null;
      }).filter(Boolean);

      // Сохраняем в запланированные — дата завтра 10:00
      const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);tomorrow.setHours(10,0,0,0);
      const dt=tomorrow.toISOString().slice(0,16);
      const res=await fetch(`${API}/planned/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({title:workoutPlan.title||"AI тренировка",planned_datetime:dt,
          exercise_ids:exIds})});
      if(res.ok){setSaved(true);setWorkoutPlan(null);}
      else setSaving(false);
    }catch{setSaving(false);}
    finally{setSaving(false);}
  }

  return <div style={{padding:"16px 16px 100px"}}>
    <Kicker>AI ТРЕНЕР</Kicker><Hero>ТРЕНЕР НА СВЯЗИ</Hero>
    <div style={{color:C.muted,fontSize:13,marginTop:6,marginBottom:16,fontFamily:"monospace"}}>ЗАПРОСОВ ОСТАЛОСЬ · <Mono size={13}>{requestsLeft}</Mono></div>
    <div style={{display:"flex",gap:8,marginBottom:16}}>
      <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask(q)}
        placeholder="СПРОСИ ЧТО УГОДНО..." style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,fontFamily:"monospace",outline:"none"}}/>
      <button onClick={()=>ask(q)} disabled={loading||!q.trim()}
        style={{background:C.accent,border:"none",borderRadius:8,padding:"10px 16px",color:C.bg,fontWeight:700,fontSize:14,cursor:"pointer",opacity:loading||!q.trim()?0.5:1}}>→</button>
    </div>
    <div style={{marginBottom:16}}>
      <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:8}}>БЫСТРЫЕ ВОПРОСЫ</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {suggs.map((s,i)=><button key={i} onClick={()=>{setQ(s);ask(s);}}
          style={{background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:13,cursor:"pointer",textAlign:"left"}}>{s} →</button>)}
      </div>
    </div>
    {loading&&<Card><div style={{textAlign:"center",padding:"16px 0"}}><div style={{color:C.accent,fontFamily:"monospace",fontSize:12,letterSpacing:2}}>ТРЕНЕР ДУМАЕТ...</div></div></Card>}
    {answer&&<Card accent>
      <Kicker>ОТВЕТ ТРЕНЕРА</Kicker>
      <div style={{fontSize:14,color:C.text,lineHeight:1.6,marginTop:8,whiteSpace:"pre-wrap"}}>{answer}</div>

      {/* Кнопка сохранения тренировки если AI предложил план */}
      {workoutPlan&&!saved&&(
        <div style={{marginTop:16,padding:"12px 14px",background:"#C8FF0015",border:`0.5px solid ${C.accent}`,borderRadius:10}}>
          <div style={{fontSize:12,color:C.accent,fontFamily:"monospace",marginBottom:6}}>💪 AI ПРЕДЛАГАЕТ ТРЕНИРОВКУ</div>
          <div style={{fontSize:14,fontWeight:600,color:C.text,marginBottom:4}}>{workoutPlan.title}</div>
          {workoutPlan.exercises?.length>0&&(
            <div style={{fontSize:12,color:C.muted,marginBottom:10}}>{workoutPlan.exercises.slice(0,4).join(" · ")}{workoutPlan.exercises.length>4?` +${workoutPlan.exercises.length-4} ещё`:""}</div>
          )}
          <Btn accent full onClick={saveWorkoutPlan} disabled={saving}>
            {saving?"СОХРАНЯЕМ...":"📅 СОХРАНИТЬ В РАСПИСАНИЕ"}
          </Btn>
          <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",textAlign:"center",marginTop:6}}>Тренировка добавится на завтра в 10:00</div>
        </div>
      )}
      {saved&&<div style={{marginTop:12,background:"#00CC6622",border:`0.5px solid ${C.success}`,borderRadius:10,padding:"10px 14px",fontSize:12,color:C.success,fontFamily:"monospace"}}>✓ ТРЕНИРОВКА СОХРАНЕНА → вкладка Запланированные</div>}

      <div style={{display:"flex",gap:8,marginTop:12}}>
        <button onClick={()=>setAnswer(null)}
          style={{flex:1,background:"none",border:`0.5px solid ${C.accent}`,borderRadius:8,padding:"8px 16px",color:C.accent,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>
          + ЕЩЁ ВОПРОС
        </button>
        {saved&&<button onClick={()=>onNav&&onNav("my_workouts")}
          style={{flex:1,background:C.card,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"8px 16px",color:C.text,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>
          ОТКРЫТЬ РАСПИСАНИЕ →
        </button>}
      </div>
    </Card>}
  </div>;
}

// ─── NUTRITION ────────────────────────────────────────────────────────────────
function NutritionScreen({tgId,onBack}){
  const [data,setData]=useState(null);
  const [error,setError]=useState(null);
  const [adding,setAdding]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({meal_name:"",kcal:"",protein:"",fat:"",carb:""});

  function load(){
    if(!tgId){setError("Войди через Telegram");return;}
    fetch(`${API}/nutrition/${tgId}`).then(r=>r.json()).then(setData).catch(()=>setError("Ошибка загрузки"));
  }
  useEffect(()=>{load();},[]);

  async function addMeal(){
    if(!form.meal_name.trim()||!form.kcal)return;
    setSaving(true);
    try{
      const res=await fetch(`${API}/nutrition/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({meal_name:form.meal_name,kcal:parseFloat(form.kcal)||0,protein:parseFloat(form.protein)||0,fat:parseFloat(form.fat)||0,carb:parseFloat(form.carb)||0})});
      if(res.ok){setAdding(false);setForm({meal_name:"",kcal:"",protein:"",fat:"",carb:""});setData(null);load();}
    }catch{}finally{setSaving(false);}
  }

  if(error)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Card><div style={{color:C.danger,fontFamily:"monospace",fontSize:13}}>{error}</div></Card></div>;
  if(!data)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="ПИТАНИЕ"/></div>;

  const t=data.today_totals||{};
  const pct=Math.min(100,Math.round(((t.kcal||0)/Math.max(data.target_kcal,1))*100));

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>ПИТАНИЕ СЕГОДНЯ</Kicker><Hero>НУТРИЕНТЫ</Hero>
    <div style={{height:16}}/>

    <Card accent style={{marginBottom:12}}>
      <Kicker>КАЛОРИИ</Kicker>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:8}}>
        <Mono>{t.kcal||0} <span style={{fontSize:13,color:C.muted,fontWeight:400}}>ккал</span></Mono>
        <span style={{fontFamily:"monospace",fontSize:12,color:C.muted}}>цель {data.target_kcal}</span>
      </div>
      <div style={{marginTop:10}}><ProgressBar pct={pct}/></div>
      <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginTop:4}}>{pct}% ОТ ЦЕЛИ · TDEE {data.tdee}</div>
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
      {[{l:"БЕЛОК",v:t.protein||0},{l:"ЖИРЫ",v:t.fat||0},{l:"УГЛЕВОДЫ",v:t.carb||0}].map((m,i)=>(
        <Card key={i} style={{textAlign:"center"}}>
          <div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:6}}>{m.l}</div>
          <Mono size={14}>{m.v} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>г</span></Mono>
        </Card>
      ))}
    </div>

    {!adding
      ?<Btn accent full onClick={()=>setAdding(true)} style={{marginBottom:16}}>+ ДОБАВИТЬ ПРИЁМ ПИЩИ</Btn>
      :<Card style={{marginBottom:16}}>
        <Kicker>НОВЫЙ ПРИЁМ ПИЩИ</Kicker>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginTop:10}}>
          <input value={form.meal_name} onChange={e=>setForm(p=>({...p,meal_name:e.target.value}))} placeholder="Название блюда / приём пищи"
            style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,outline:"none"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div>
              <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:4}}>КАЛОРИИ *</div>
              <input type="number" value={form.kcal} onChange={e=>setForm(p=>({...p,kcal:e.target.value}))} placeholder="0"
                style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.accent,fontSize:16,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:4}}>БЕЛОК (г)</div>
              <input type="number" value={form.protein} onChange={e=>setForm(p=>({...p,protein:e.target.value}))} placeholder="0"
                style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:16,fontFamily:"monospace",width:"100%",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:4}}>ЖИРЫ (г)</div>
              <input type="number" value={form.fat} onChange={e=>setForm(p=>({...p,fat:e.target.value}))} placeholder="0"
                style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:16,fontFamily:"monospace",width:"100%",outline:"none",boxSizing:"border-box"}}/>
            </div>
            <div>
              <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginBottom:4}}>УГЛЕВОДЫ (г)</div>
              <input type="number" value={form.carb} onChange={e=>setForm(p=>({...p,carb:e.target.value}))} placeholder="0"
                style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:16,fontFamily:"monospace",width:"100%",outline:"none",boxSizing:"border-box"}}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <Btn full onClick={()=>setAdding(false)} style={{flex:1}}>ОТМЕНА</Btn>
            <Btn accent full onClick={addMeal} disabled={saving||!form.meal_name.trim()||!form.kcal} style={{flex:2}}>{saving?"СОХРАНЯЕМ...":"СОХРАНИТЬ"}</Btn>
          </div>
        </div>
      </Card>
    }

    <Kicker>ПРИЁМЫ ПИЩИ</Kicker>
    {data.today_logs?.length>0
      ?<div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
        {data.today_logs.map((l,i)=>(
          <Card key={i}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div style={{fontWeight:600,fontSize:14,color:C.text}}>{l.meal_name}</div>
              <Mono size={14}>{l.kcal||0} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>ккал</span></Mono>
            </div>
            <div style={{display:"flex",gap:12,marginTop:6}}>
              <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>Б {l.protein}г</span>
              <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>Ж {l.fat}г</span>
              <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>У {l.carb}г</span>
            </div>
          </Card>
        ))}
      </div>
      :<Card style={{marginTop:8}}><div style={{textAlign:"center",padding:"12px 0",color:C.muted,fontSize:14}}>Записей нет — добавь первый приём</div></Card>
    }
  </div>;
}

// ─── FOOD GUIDE ───────────────────────────────────────────────────────────────
function FoodGuideScreen({onBack}){
  const [cats,setCats]=useState(null);const [sel,setSel]=useState(null);
  useEffect(()=>{fetch(`${API}/food-guide`).then(r=>r.json()).then(d=>setCats(d.categories||[])).catch(()=>setCats([]));},[]);
  if(sel)return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={()=>setSel(null)}/>
    <div style={{fontSize:40,marginBottom:8}}>{sel.emoji}</div>
    <Kicker>СПРАВОЧНИК ПРОДУКТОВ</Kicker><Hero>{sel.name}</Hero>
    <div style={{height:16}}/>
    <Card accent style={{marginBottom:10}}>
      <Kicker>КБЖУ НА 100Г</Kicker>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>
        {[{l:"КАЛОРИИ",v:sel.kcal,u:"ккал"},{l:"БЕЛОК",v:sel.protein,u:"г"},{l:"ЖИРЫ",v:sel.fat,u:"г"},{l:"УГЛЕВОДЫ",v:sel.carb,u:"г"}].map((m,i)=><div key={i}><div style={{fontSize:9,color:C.muted,fontFamily:"monospace"}}>{m.l}</div><Mono size={14}>{m.v} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>{m.u}</span></Mono></div>)}
      </div>
    </Card>
    {[{label:"⏰ КОГДА ЕСТЬ",value:sel.timing},{label:"💡 СОВЕТЫ",value:sel.tips},{label:"🏆 ЛУЧШИЕ ПРОДУКТЫ",value:sel.best},{label:"✅ СОЧЕТАЕТСЯ С",value:sel.combines},{label:"❌ НЕ СОЧЕТАТЬ",value:sel.avoid}].map((r,i)=><Card key={i} style={{marginBottom:8}}><Kicker>{r.label}</Kicker><div style={{fontSize:13,color:C.text,lineHeight:1.6,marginTop:4}}>{r.value}</div></Card>)}
  </div>;
  if(!cats)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader/></div>;
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>СПРАВОЧНИК</Kicker><Hero>КАТАЛОГ ПРОДУКТОВ</Hero>
    <div style={{height:16}}/>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {cats.map((c,i)=><Card key={i} onClick={()=>setSel(c)}>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <span style={{fontSize:32}}>{c.emoji}</span>
          <div style={{flex:1}}><div style={{fontWeight:600,fontSize:15,color:C.text}}>{c.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2,fontFamily:"monospace"}}>{c.kcal} ккал · Б {c.protein}г · Ж {c.fat}г · У {c.carb}г</div></div>
          <span style={{color:C.accent,fontSize:16}}>→</span>
        </div>
      </Card>)}
    </div>
  </div>;
}

// ─── SUPPLEMENTS ──────────────────────────────────────────────────────────────
function SupplementsScreen({onBack,user}){
  const [sel,setSel]=useState(null);
  const supps=[
    {name:"Протеин",icon:"🥛",dose:"20–40г за приём",timing:"После тренировки или в любое время дня",
      tips:"Восполнение белка. Сывороточный — быстрый, казеин — медленный (на ночь).",
      evidence:"🟢 Высокий уровень доказательности",
      contraindications:["kidney_disease"],
      links:[{label:"Examine.com — Protein",url:"https://examine.com/supplements/protein-powder/"}]},
    {name:"Креатин моногидрат",icon:"⚡",dose:"3–5г/день",timing:"В любое время, ежедневно",
      tips:"Без загрузки. Результат через 2–4 недели. Запивай водой (250мл). Один из самых изученных препаратов.",
      evidence:"🟢 Высокий уровень доказательности",
      contraindications:["kidney_disease"],
      links:[{label:"Examine.com — Creatine",url:"https://examine.com/supplements/creatine/"}]},
    {name:"Омега-3",icon:"🐟",dose:"1–3г EPA+DHA/день",timing:"Во время еды",
      tips:"Противовоспалительный эффект, суставы, сердце. Смотри на содержание EPA+DHA, не общий жир рыбы.",
      evidence:"🟢 Высокий уровень доказательности",
      contraindications:["fish_oil"],
      links:[{label:"Examine.com — Omega-3",url:"https://examine.com/supplements/fish-oil/"}]},
    {name:"Витамин D3",icon:"☀️",dose:"2000–5000 МЕ/день",timing:"Утром с жирной едой",
      tips:"Иммунитет, тестостерон, кости. Принимать с K2 (100–200мкг) для правильного усвоения кальция.",
      evidence:"🟢 Высокий уровень доказательности",
      contraindications:[],
      links:[{label:"Examine.com — Vitamin D",url:"https://examine.com/supplements/vitamin-d/"}]},
    {name:"Магний",icon:"💊",dose:"200–400мг",timing:"Перед сном",
      tips:"Качество сна, мышечное восстановление, снижение стресса. Форма: глицинат или малат (не оксид — плохо усваивается).",
      evidence:"🟡 Умеренный уровень доказательности",
      contraindications:[],
      links:[{label:"Examine.com — Magnesium",url:"https://examine.com/supplements/magnesium/"}]},
    {name:"Кофеин",icon:"☕",dose:"3–6мг/кг веса",timing:"За 30–45 мин до тренировки",
      tips:"Повышает выносливость, силу и концентрацию. Не принимать после 15:00 — нарушает сон. Допуск развивается быстро.",
      evidence:"🟢 Высокий уровень доказательности",
      contraindications:["hypertension","heart_disease"],
      links:[{label:"Examine.com — Caffeine",url:"https://examine.com/supplements/caffeine/"}]},
    {name:"Цинк",icon:"🔩",dose:"15–30мг/день",timing:"Во время еды или перед сном",
      tips:"Иммунитет, тестостерон, восстановление. Не принимать вместе с кальцием — конкурируют за усвоение.",
      evidence:"🟡 Умеренный уровень доказательности",
      contraindications:[],
      links:[{label:"Examine.com — Zinc",url:"https://examine.com/supplements/zinc/"}]},
    {name:"Коллаген",icon:"🦴",dose:"10г/день",timing:"За 1 час до тренировки с витамином C",
      tips:"Суставы и связки. Необходим витамин C (100мг) для синтеза коллагена. Эффект накопительный — 8–12 недель.",
      evidence:"🟡 Умеренный уровень доказательности",
      contraindications:[],
      links:[{label:"Examine.com — Collagen",url:"https://examine.com/supplements/collagen/"}]},
  ];

  // Персонализация по профилю
  const userConditions=user?.medical_conditions||[];
  const userAllergies=user?.allergies||[];
  const weight=user?.weight;

  function getWarning(s){
    const w=[];
    if(s.contraindications.some(c=>userConditions.includes(c)))w.push("⚠️ Проконсультируйся с врачом — есть противопоказания");
    if(s.contraindications.some(c=>userAllergies.includes(c)))w.push("🚫 Возможна аллергическая реакция");
    return w;
  }
  function personalDose(s){
    if(s.name==="Кофеин"&&weight)return`${Math.round(3*weight)}–${Math.round(6*weight)}мг (${Math.round(3*weight/100)}–${Math.round(6*weight/100)} таб по 100мг)`;
    return s.dose;
  }

  if(sel){
    const warnings=getWarning(sel);
    return <div style={{padding:"16px 16px 100px"}}>
      <BackBtn onBack={()=>setSel(null)}/>
      <div style={{fontSize:40,marginBottom:8}}>{sel.icon}</div>
      <Kicker>СПОРТИВНЫЕ ДОБАВКИ</Kicker><Hero>{sel.name}</Hero>
      <div style={{marginTop:8,marginBottom:16,fontSize:12,color:C.muted,fontFamily:"monospace"}}>{sel.evidence}</div>
      {warnings.length>0&&warnings.map((w,i)=><div key={i} style={{background:"#FF444422",border:`0.5px solid ${C.danger}`,borderRadius:10,padding:"10px 14px",marginBottom:10,fontSize:13,color:C.danger}}>{w}</div>)}
      <Card accent style={{marginBottom:10}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>ДОЗА{weight?" (ТВОЙ ВЕС "+weight+"КГ)":""}</div><div style={{fontSize:14,color:C.accent,fontWeight:600}}>{personalDose(sel)}</div></div>
          <div><div style={{fontSize:9,color:C.muted,fontFamily:"monospace",marginBottom:4}}>КОГДА ПРИНИМАТЬ</div><div style={{fontSize:14,color:C.accent,fontWeight:600}}>{sel.timing}</div></div>
        </div>
      </Card>
      <Card style={{marginBottom:10}}><Kicker>ОПИСАНИЕ И СОВЕТЫ</Kicker><div style={{fontSize:14,color:C.text,lineHeight:1.6,marginTop:6}}>{sel.tips}</div></Card>
      {sel.links?.length>0&&<Card><Kicker>ИСТОЧНИКИ</Kicker><div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>{sel.links.map((l,i)=><button key={i} onClick={()=>{if(window.Telegram?.WebApp?.openLink)window.Telegram.WebApp.openLink(l.url);else window.open(l.url,'_blank');}} style={{background:"none",border:`0.5px solid ${C.accent}`,borderRadius:8,padding:"8px 12px",fontSize:13,color:C.accent,cursor:"pointer",display:"flex",alignItems:"center",gap:6,width:"100%",textAlign:"left"}}>🔗 {l.label}</button>)}</div></Card>}
    </div>;
  }

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>СПРАВОЧНИК</Kicker><Hero>ДОБАВКИ</Hero>
    {user&&<div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginTop:6,marginBottom:8}}>ПРОФИЛЬ · {user.weight}кг · {user.fitness_level?.toUpperCase()}</div>}
    <div style={{background:"#FFB80015",border:`0.5px solid ${C.warn}`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:11,color:C.warn,lineHeight:1.6}}>
      ⚠️ Применение витаминов и добавок носит рекомендательный характер и не является медицинской рекомендацией. Перед применением проконсультируйтесь с врачом.
    </div>
    <div style={{height:4}}/>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {supps.map((s,i)=>{
        const warnings=getWarning(s);
        return <Card key={i} onClick={()=>setSel(s)}>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <span style={{fontSize:32}}>{s.icon}</span>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{fontWeight:600,fontSize:15,color:C.text}}>{s.name}</div>
                {warnings.length>0&&<span style={{fontSize:14}}>⚠️</span>}
              </div>
              <div style={{fontSize:11,color:C.muted,marginTop:2,fontFamily:"monospace"}}>{personalDose(s)}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:2}}>{s.evidence}</div>
            </div>
            <span style={{color:C.accent,fontSize:16}}>→</span>
          </div>
        </Card>;
      })}
    </div>
  </div>;
}

// ─── MEASUREMENTS / CHECKIN / LANGUAGE / SUPPORT / GOALS / REMINDERS ─────────
function MeasurementsScreen({onBack,tgId}){
  const [view,setView]=useState("add"); // "add" | "history"
  const [history,setHistory]=useState(null);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [form,setForm]=useState({waist:"",hips:"",chest:"",arm:"",thigh:""});
  const fields=[{key:"waist",label:"Талия"},{key:"hips",label:"Бёдра"},{key:"chest",label:"Грудь"},{key:"arm",label:"Рука (бицепс)"},{key:"thigh",label:"Бедро"}];

  useEffect(()=>{
    if(view==="history"&&!history){
      if(tgId)fetch(`${API}/measurements/${tgId}`).then(r=>r.json()).then(d=>setHistory(d.logs||[])).catch(()=>setHistory([]));
      else setHistory([]);
    }
  },[view]);

  async function save(){
    const data=Object.fromEntries(Object.entries(form).filter(([,v])=>v).map(([k,v])=>[k,parseFloat(v)]));
    if(!Object.keys(data).length)return;
    setSaving(true);
    try{
      const res=await fetch(`${API}/measurements/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      if(res.ok){setSaved(true);setForm({waist:"",hips:"",chest:"",arm:"",thigh:""});setHistory(null);setTimeout(()=>setSaved(false),3000);}
    }catch{}finally{setSaving(false);}
  }

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>АНТРОПОМЕТРИЯ</Kicker><Hero>ЗАМЕРЫ ТЕЛА</Hero>
    <div style={{display:"flex",gap:0,margin:"16px 0",border:`0.5px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
      {[{id:"add",label:"ДОБАВИТЬ"},{id:"history",label:"ИСТОРИЯ"}].map(t=>(
        <button key={t.id} onClick={()=>setView(t.id)} style={{flex:1,padding:"10px",background:view===t.id?C.accent:C.card,border:"none",color:view===t.id?C.bg:C.muted,fontFamily:"monospace",fontSize:11,fontWeight:700,cursor:"pointer"}}>
          {t.label}
        </button>
      ))}
    </div>

    {view==="add"&&<>
      {saved&&<div style={{background:"#00CC6622",border:`0.5px solid ${C.success}`,borderRadius:10,padding:"10px 14px",marginBottom:12,fontFamily:"monospace",fontSize:12,color:C.success}}>✓ ЗАМЕРЫ СОХРАНЕНЫ</div>}
      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
        {fields.map(f=><Card key={f.key}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:13,color:C.muted,fontFamily:"monospace",marginBottom:6}}>{f.label.toUpperCase()}</div>
              <input type="number" value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder="0"
                style={{background:"none",border:"none",color:C.accent,fontSize:22,fontFamily:"monospace",fontWeight:700,width:80,outline:"none"}}/>
            </div>
            <span style={{fontFamily:"monospace",fontSize:14,color:C.muted}}>см</span>
          </div>
        </Card>)}
      </div>
      <Btn accent full onClick={save} disabled={saving||!Object.values(form).some(v=>v)}>
        {saving?"СОХРАНЯЕМ...":"СОХРАНИТЬ ЗАМЕРЫ"}
      </Btn>
      <div style={{fontSize:11,color:C.muted,fontFamily:"monospace",textAlign:"center",marginTop:8}}>Замеры хранятся в истории — можно отслеживать динамику</div>
    </>}

    {view==="history"&&(
      !history?<Loader text="ИСТОРИЯ"/>:
      history.length===0?<Card><div style={{textAlign:"center",padding:"16px 0",color:C.muted}}>Замеров пока нет</div></Card>:
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {history.map((h,i)=><Card key={i}>
          <Kicker>{new Date(h.logged_at||h.created_at).toLocaleDateString("ru",{day:"numeric",month:"long"})}</Kicker>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 16px",marginTop:8}}>
            {fields.map(f=>h[f.key]?<div key={f.key}>
              <span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{f.label}: </span>
              <Mono size={13}>{h[f.key]} <span style={{fontSize:11,color:C.muted,fontWeight:400}}>см</span></Mono>
            </div>:null)}
          </div>
        </Card>)}
      </div>
    )}
  </div>;
}

function CheckinScreen({onBack,tgId}){
  const [sent,setSent]=useState(false);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({weight:"",sleep_hours:"",energy:3,sleep:3,stress:3,motivation:3});
  const sliders=[{key:"energy",label:"Энергия",lo:"😴",hi:"⚡"},{key:"sleep",label:"Сон",lo:"😞",hi:"😴✨"},{key:"stress",label:"Стресс",lo:"😌",hi:"😤"},{key:"motivation",label:"Мотивация",lo:"😑",hi:"🔥"}];

  async function send(){
    setSaving(true);
    const body={...form,weight:parseFloat(form.weight)||null,sleep_hours:parseFloat(form.sleep_hours)||null};
    try{
      if(tgId){
        await fetch(`${API}/checkin/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      }
    }catch{}finally{setSaving(false);}
    setSent(true);
  }

  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/>
    <Kicker>ЕЖЕНЕДЕЛЬНЫЙ</Kicker><Hero>ЧЕК-ИН</Hero>
    <Card style={{marginBottom:16}}>
      <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>
        Заполняй раз в неделю — в воскресенье вечером или понедельник утром.<br/>
        <span style={{color:C.accent}}>AI тренер</span> учитывает твой чек-ин при составлении планов, ответах и советах.
      </div>
    </Card>
    <div style={{height:8}}/>
    {sent
      ?<Card accent><div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:32,color:C.accent}}>✓</div><div style={{fontFamily:"monospace",fontSize:13,color:C.accent,marginTop:8}}>ЧЕК-ИН СОХРАНЁН</div><div style={{fontSize:12,color:C.muted,marginTop:6}}>AI тренер получил обновлённые данные</div></div></Card>
      :<>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <Card>
            <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:8}}>ВЕС (КГ)</div>
            <input type="number" step="0.1" value={form.weight} onChange={e=>setForm(p=>({...p,weight:e.target.value}))} placeholder="0.0"
              style={{background:"none",border:"none",color:C.accent,fontSize:26,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none"}}/>
          </Card>
          <Card>
            <div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:8}}>СОН (ЧАСОВ)</div>
            <input type="number" step="0.5" min="0" max="24" value={form.sleep_hours} onChange={e=>setForm(p=>({...p,sleep_hours:e.target.value}))} placeholder="7.5"
              style={{background:"none",border:"none",color:C.accent,fontSize:26,fontFamily:"monospace",fontWeight:700,width:"100%",outline:"none"}}/>
          </Card>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
          {sliders.map(s=>(
            <Card key={s.key}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:12,color:C.muted,fontFamily:"monospace"}}>{s.label.toUpperCase()}</span>
                <Mono size={14}>{form[s.key]}/5</Mono>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:14}}>{s.lo}</span>
                <input type="range" min={1} max={5} value={form[s.key]} onChange={e=>setForm(p=>({...p,[s.key]:+e.target.value}))} style={{flex:1,accentColor:C.accent}}/>
                <span style={{fontSize:14}}>{s.hi}</span>
              </div>
            </Card>
          ))}
        </div>
        <Btn accent full onClick={send} disabled={saving}>{saving?"СОХРАНЯЕМ...":"ОТПРАВИТЬ ЧЕК-ИН"}</Btn>
      </>
    }
  </div>;
}

function LanguageScreen({tgId,user,onBack,onUserUpdated}){
  const [saving,setSaving]=useState(false);
  const langs=[{code:"ru",label:"🇷🇺 Русский"},{code:"en",label:"🇬🇧 English"},{code:"uz",label:"🇺🇿 O'zbek"}];
  async function setLang(code){setSaving(code);try{await fetch(`${API}/user/${tgId}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang:code})});onUserUpdated();setTimeout(onBack,500);}catch{}finally{setSaving(false);};}
  const cur=user?.lang||"ru";
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>НАСТРОЙКИ</Kicker><Hero>ЯЗЫК</Hero><div style={{height:16}}/>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {langs.map(l=><Card key={l.code} onClick={()=>setLang(l.code)} accent={cur===l.code}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:16,color:C.text,fontWeight:cur===l.code?700:400}}>{l.label}</span>{cur===l.code&&<span style={{color:C.accent,fontFamily:"monospace",fontSize:12}}>✓ ТЕКУЩИЙ</span>}{saving===l.code&&<span style={{color:C.muted,fontFamily:"monospace",fontSize:11}}>...</span>}</div>
      </Card>)}
    </div>
  </div>;
}

function SupportScreen({onBack,tgId}){
  const [msg,setMsg]=useState("");
  const [sent,setSent]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState(null);

  async function send(){
    if(!msg.trim())return;
    setSaving(true);setError(null);
    try{
      const res=await fetch(`${API}/support`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({tg_id:tgId||0,message:msg.trim(),
          user_name:tg?.initDataUnsafe?.user?.first_name||"Mini App User",
          username:tg?.initDataUnsafe?.user?.username||""})
      });
      if(res.ok){setSent(true);}
      else{setError("Ошибка отправки. Попробуй позже.");}
    }catch{setError("Нет соединения. Попробуй позже.");}
    finally{setSaving(false);}
  }
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>ОБРАТНАЯ СВЯЗЬ</Kicker><Hero>ПОДДЕРЖКА</Hero><div style={{height:16}}/>
    {sent?<Card accent><div style={{textAlign:"center",padding:"20px 0"}}><div style={{fontSize:32,color:C.accent}}>✓</div><div style={{fontFamily:"monospace",fontSize:13,color:C.accent,marginTop:8}}>ОТПРАВЛЕНО</div></div></Card>:<>
      <Card style={{marginBottom:16}}><div style={{fontSize:12,color:C.muted,fontFamily:"monospace",marginBottom:10}}>ОПИШИ ПРОБЛЕМУ ИЛИ ВОПРОС</div><textarea value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Опишите ваше обращение, мы ответим в ближайшее время" rows={5} style={{width:"100%",background:"none",border:"none",color:C.text,fontSize:14,lineHeight:1.6,resize:"none",outline:"none",boxSizing:"border-box"}}/></Card>
      <Btn accent full onClick={send} disabled={saving||!msg.trim()}>
              {saving?"ОТПРАВЛЯЕМ...":"ОТПРАВИТЬ"}
            </Btn>
            {error&&<div style={{marginTop:10,fontSize:12,color:C.danger,fontFamily:"monospace",textAlign:"center"}}>{error}</div>}
    </>}
  </div>;
}

function GoalsScreen({tgId,onBack}){
  const [data,setData]=useState(null);const [adding,setAdding]=useState(false);const [form,setForm]=useState({description:"",target_value:"",unit:"кг",deadline:""});const [saving,setSaving]=useState(false);
  function load(){if(!tgId){setData({goals:[]});return;}fetch(`${API}/goals/${tgId}`).then(r=>r.json()).then(setData).catch(()=>setData({goals:[]}));}
  useEffect(()=>{load();},[]);
  async function add(){if(!form.description.trim())return;setSaving(true);try{const res=await fetch(`${API}/goals/${tgId}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({description:form.description,target_value:parseFloat(form.target_value)||null,unit:form.unit||null,deadline:form.deadline||null,goal_type:"custom"})});if(res.ok){setAdding(false);setForm({description:"",target_value:"",unit:"кг",deadline:""});load();}}catch{}finally{setSaving(false);};}
  if(!data)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader text="ЦЕЛИ"/></div>;
  const active=data.goals.filter(g=>!g.is_achieved);const done=data.goals.filter(g=>g.is_achieved);
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>ПРОГРЕСС</Kicker><Hero>МОИ ЦЕЛИ</Hero><div style={{height:16}}/>
    {!adding?<Btn accent full onClick={()=>setAdding(true)} style={{marginBottom:16}}>+ ДОБАВИТЬ ЦЕЛЬ</Btn>:
    <Card style={{marginBottom:16}}><Kicker>НОВАЯ ЦЕЛЬ</Kicker><div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
      <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Описание цели..." style={{background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,outline:"none"}}/>
      <div style={{display:"flex",gap:8}}>
        <input type="number" value={form.target_value} onChange={e=>setForm(p=>({...p,target_value:e.target.value}))} placeholder="Цель" style={{flex:2,background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.accent,fontSize:14,fontFamily:"monospace",outline:"none"}}/>
        <input value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))} placeholder="ед." style={{flex:1,background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.muted,fontSize:14,outline:"none"}}/>
      </div>
      <input type="date" value={form.deadline} onChange={e=>setForm(p=>({...p,deadline:e.target.value}))} style={{colorScheme:"dark",background:C.bg,border:`0.5px solid ${C.border}`,borderRadius:8,padding:"10px 12px",color:C.muted,fontSize:13,outline:"none"}}/>
      <div style={{display:"flex",gap:8}}><Btn full onClick={()=>setAdding(false)} style={{flex:1}}>ОТМЕНА</Btn><Btn accent full onClick={add} disabled={saving||!form.description.trim()} style={{flex:2}}>{saving?"...":"СОХРАНИТЬ"}</Btn></div>
    </div></Card>}
    {active.length===0&&!adding&&<Card style={{marginBottom:12}}><div style={{textAlign:"center",padding:"16px 0",color:C.muted}}>Активных целей нет. Поставь первую!</div></Card>}
    {active.map(g=><Card key={g.id} style={{marginBottom:8}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><div style={{fontWeight:600,fontSize:14,color:C.text,flex:1}}>{g.description}</div><Mono size={12}>{g.pct}%</Mono></div>
      <div style={{marginBottom:6}}><ProgressBar pct={g.pct}/></div>
      <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>{g.current_value}/{g.target_value} {g.unit}</span>{g.days_left!=null&&<span style={{fontSize:11,color:g.days_left<7?C.danger:C.muted,fontFamily:"monospace"}}>{g.days_left} дн.</span>}</div>
    </Card>)}
    {done.length>0&&<><Kicker style={{marginTop:16}}>ДОСТИГНУТО</Kicker>{done.map(g=><Card key={g.id} style={{marginBottom:8,opacity:0.6}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:14,color:C.success}}>✓ {g.description}</span><Mono size={12} color={C.success}>100%</Mono></div></Card>)}</>}
  </div>;
}

function RemindersScreen({tgId,onBack,onNav}){
  const [data,setData]=useState(null);
  useEffect(()=>{if(!tgId){setData({reminders:[]});return;}fetch(`${API}/reminders/${tgId}`).then(r=>r.json()).then(setData).catch(()=>setData({reminders:[]}));},[]);
  const fmt=iso=>{const d=new Date(iso);return d.toLocaleString("ru",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});};
  if(!data)return <div style={{padding:"16px 16px 100px"}}><BackBtn onBack={onBack}/><Loader/></div>;
  return <div style={{padding:"16px 16px 100px"}}>
    <BackBtn onBack={onBack}/><Kicker>УВЕДОМЛЕНИЯ</Kicker><Hero>НАПОМИНАНИЯ</Hero><div style={{height:16}}/>
    <Card style={{marginBottom:16}}><div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>🔔 Бот напоминает за <span style={{color:C.accent}}>1 час</span> до тренировки.<br/>Плато-детектор проверяет каждое воскресенье в 10:30.</div></Card>
    <Kicker>БЛИЖАЙШИЕ ТРЕНИРОВКИ</Kicker>
    {data.reminders.length===0?<Card><div style={{textAlign:"center",padding:"16px 0"}}><div style={{color:C.muted,fontSize:14}}>Нет предстоящих тренировок</div><button onClick={()=>onNav("plan_workout")} style={{marginTop:10,background:"none",border:`0.5px solid ${C.accent}`,borderRadius:8,padding:"8px 16px",color:C.accent,fontSize:12,fontFamily:"monospace",cursor:"pointer"}}>+ ЗАПЛАНИРОВАТЬ</button></div></Card>:
    <div style={{display:"flex",flexDirection:"column",gap:8}}>{data.reminders.map((r,i)=><Card key={i} onClick={()=>r.id&&onNav&&onNav("planned_detail",{pwId:r.id})} style={{cursor:r.id?"pointer":"default"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:4}}>{r.title}</div>
            <div style={{fontSize:12,color:C.accent,fontFamily:"monospace"}}>🔔 {fmt(r.dt)}</div>
          </div>
          {r.id&&<span style={{fontSize:11,color:C.muted,fontFamily:"monospace"}}>→</span>}
        </div>
      </Card>)}</div>}
  </div>;
}

// ─── ROOT ──────────────────────────────────────────────────────────────────────
export default function App(){
  function getNav(){const s=window.history.state;return s&&s._g?s:{_g:true,tab:"menu",screen:null,params:{}};}
  const [nav,setNav]=useState(getNav);
  const {tab,screen,params={}}=nav;

  const [user,setUser]=useState(null);
  const [workouts,setWorkouts]=useState(null);
  const [stats,setStats]=useState(null);
  const [exercises,setExercises]=useState(null);
  const [muscleGroups,setMuscleGroups]=useState(null);
  const tgId=tg?.initDataUnsafe?.user?.id;

  function push(tab,screen,params={}){const s={_g:true,tab,screen,params};window.history.pushState(s,"");setNav(s);}
  function replace(tab,screen,params={}){const s={_g:true,tab,screen,params};window.history.replaceState(s,"");setNav(s);}
  function loadUser(){
    if(tgId){
      fetch(`${API}/user/${tgId}`)
        .then(r=>{
          if(r.status===404){
            // Пользователь не найден в БД — новая регистрация через Mini App
            setUser({first_name:tg?.initDataUnsafe?.user?.first_name||"Атлет",ai_requests_today:0,_not_found:true});
            return null;
          }
          if(!r.ok) throw new Error(r.status);
          return r.json();
        })
        .then(d=>{if(d)setUser(d);})
        .catch(()=>setUser({first_name:tg?.initDataUnsafe?.user?.first_name||"Атлет",ai_requests_today:0,_error:true}));
    } else {
      setUser({first_name:"Атлет",ai_requests_today:0});
    }
  }

  useEffect(()=>{
    tg?.ready();tg?.expand();
    // Инжектируем CSS для date/time пикеров в тёмной теме
    if(!document.getElementById("gymbot-datepicker-style")){
      const s=document.createElement("style");s.id="gymbot-datepicker-style";
      s.textContent='input[type="date"],input[type="time"]{color-scheme:dark;} input[type="date"]::-webkit-calendar-picker-indicator,input[type="time"]::-webkit-calendar-picker-indicator{filter:invert(1) brightness(0.8) sepia(1) hue-rotate(60deg);cursor:pointer;}';
      document.head.appendChild(s);
    }
    loadUser();
    fetch(`${API}/exercises`).then(r=>r.json()).then(d=>{setExercises(d.exercises||[]);setMuscleGroups(d.muscle_groups||[]);}).catch(()=>{setExercises([]);setMuscleGroups([]);});
    if(!window.history.state?._g)window.history.replaceState({_g:true,tab:"menu",screen:null,params:{}},"");
    function onPop(e){const s=e.state;if(s&&s._g)setNav(s);else{const h={_g:true,tab:"menu",screen:null,params:{}};window.history.replaceState(h,"");setNav(h);}}
    window.addEventListener("popstate",onPop);
    return()=>window.removeEventListener("popstate",onPop);
  },[]);

  useEffect(()=>{
    if(tab==="workout"&&!workouts){
      if(tgId)fetch(`${API}/workouts/${tgId}`).then(r=>r.json()).then(d=>setWorkouts(d.workouts||[])).catch(()=>setWorkouts([]));
      else setWorkouts([]); // без tgId показываем пустой список вместо вечного лоадера
    }
    if(tab==="progress"&&!stats){
      if(tgId)fetch(`${API}/stats/${tgId}`).then(r=>r.json()).then(setStats).catch(()=>setStats({}));
      else setStats({});
    }
  },[tab]);

  function handleTabChange(t){push(t,null,{});}
  function handleNav(s,p={}){
    if(s==="my_workouts"){push("workout",null,{});return;}
    push(tab,s,p);
  }
  const goBack=()=>window.history.back();

  function render(){
    const p=params||{};
    if(screen==="profile")return <ProfileScreen user={user} tgId={tgId} onBack={goBack} onUserUpdated={loadUser}/>;
    if(screen==="active_workout")return <ActiveWorkoutScreen tgId={tgId} exercises={exercises} muscleGroups={muscleGroups} onBack={goBack} onFinish={()=>setWorkouts(null)} preselectedExIds={p.preselectedExIds||[]}/>;
    if(screen==="workout_detail")return <WorkoutDetailScreen workoutId={p.workoutId} tgId={tgId} onBack={goBack}/>;
    if(screen==="my_workouts_detail")return <MyWorkoutsDetailScreen tgId={tgId} onBack={goBack} onNav={handleNav}/>;
    if(screen==="planned_detail")return <PlannedDetailScreen pwId={p.pwId} tgId={tgId} onBack={goBack} exercises={exercises} readOnly={p.readOnly||false} onNav={handleNav}/>;
    if(screen==="plan_workout")return <PlanWorkoutScreen tgId={tgId} exercises={exercises} muscleGroups={muscleGroups} onBack={goBack}/>;
    if(screen==="goals")return <GoalsScreen tgId={tgId} onBack={goBack}/>;
    if(screen==="reminders")return <RemindersScreen tgId={tgId} onBack={goBack} onNav={handleNav}/>;
    if(screen==="nutrition")return <NutritionScreen tgId={tgId} onBack={goBack}/>;
    if(screen==="food_guide")return <FoodGuideScreen onBack={goBack}/>;
    if(screen==="measurements")return <MeasurementsScreen onBack={goBack} tgId={tgId}/>;
    if(screen==="checkin")return <CheckinScreen onBack={goBack} tgId={tgId}/>;
    if(screen==="supplements")return <SupplementsScreen onBack={goBack} user={user}/>;
    if(screen==="rest_timer")return <StandaloneTimer onBack={goBack}/>;
    if(screen==="language")return <LanguageScreen tgId={tgId} user={user} onBack={goBack} onUserUpdated={loadUser}/>;
    if(screen==="support")return <SupportScreen onBack={goBack} tgId={tgId}/>;
    if(tab==="menu")return <MenuScreen user={user} onNav={handleNav}/>;
    if(tab==="workout")return <WorkoutHistoryScreen workouts={workouts} onNav={handleNav} tgId={tgId}/>;
    if(tab==="progress")return <ProgressScreen stats={stats}/>;
    if(tab==="catalog")return <CatalogScreen exercises={exercises} muscleGroups={muscleGroups}/>;
    if(tab==="ai")return <AIScreen user={user} tgId={tgId} onNav={handleNav} exercises={exercises}/>;
  }

  return <div style={{background:C.bg,minHeight:"100vh",color:C.text,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
    {render()}
    <NavBar active={tab} onChange={handleTabChange}/>
  </div>;
}
