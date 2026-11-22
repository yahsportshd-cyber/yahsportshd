const ADMIN_PAGE = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>YahSportsHD - الإدارة</title>
<style>
*{box-sizing:border-box}
body{margin:0;background:#071426;color:white;font-family:Arial;padding:18px}
.container{max-width:700px;margin:auto}
h2{text-align:center;color:#e6bd58}
.box{background:#10243d;padding:18px;border-radius:14px;margin:15px 0}
input,select,button{width:100%;padding:13px;margin:7px 0;border:0;border-radius:8px;font-size:16px}
input,select{background:#f1f3f5;color:#111}
button{background:#d5ad48;color:#071426;font-weight:bold}
.delete{background:#b52b35;color:white}
.edit{background:#2475a8;color:white}
.hidden{display:none}
.match{background:#192f49;padding:14px;border-radius:10px;margin:12px 0}
.match b{color:#e6bd58}
</style>
</head>
<body>
<div class="container">
<h2>YahSportsHD</h2>
<p style="text-align:center">لوحة إدارة المباريات</p>

<div class="box" id="loginBox">
<h3>تسجيل الدخول</h3>
<input type="password" id="password" placeholder="كلمة المرور">
<button onclick="login()">دخول</button>
<p id="loginMsg"></p>
</div>

<div id="dashboard" class="hidden">
<div class="box">
<h3 id="formTitle">إضافة مباراة جديدة</h3>
<input id="home" placeholder="الفريق الأول">
<input id="away" placeholder="الفريق الثاني">
<label>تاريخ المباراة</label>
<input id="date" type="date">
<label>وقت المباراة بتوقيت مكة</label>
<input id="time" type="time">
<input id="channel" placeholder="القناة الناقلة">
<select id="status">
<option value="upcoming">قادمة</option>
<option value="live">مباشرة</option>
<option value="finished">انتهت</option>
</select>
<button onclick="saveMatch()">حفظ المباراة</button>
<button class="edit" onclick="resetForm()">إلغاء التعديل</button>
<p id="msg"></p>
</div>

<div class="box">
<h3>المباريات المسجلة</h3>
<div id="matches">جاري التحميل...</div>
</div>

<button class="delete" onclick="logout()">تسجيل الخروج</button>
</div>
</div>

<script>
let editingId=null;

async function request(url,options={}){
 const r=await fetch(url,{
  ...options,
  headers:{
   "Content-Type":"application/json",
   ...(options.headers||{})
  }
 });
 const data=await r.json();
 if(!r.ok)throw new Error(data.error||"حدث خطأ");
 return data;
}

async function login(){
 const p=document.getElementById("password").value;
 try{
  await request("/api/admin/login",{
   method:"POST",
   body:JSON.stringify({password:p})
  });
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("dashboard").classList.remove("hidden");
  loadMatches();
 }catch(e){
  document.getElementById("loginMsg").textContent=e.message;
 }
}

async function loadMatches(){
 const box=document.getElementById("matches");
 try{
  const data=await request("/api/admin/matches");
  box.innerHTML="";
  if(!data.matches.length){
   box.textContent="لا توجد مباريات مسجلة";
   return;
  }
  data.matches.forEach(m=>{
   const div=document.createElement("div");
   div.className="match";

   const title=document.createElement("b");
   title.textContent=m.home_team+" × "+m.away_team;

   const details=document.createElement("p");
   details.textContent="التاريخ: "+m.match_date+
    " | الوقت: "+m.match_time+
    " | القناة: "+(m.channel||"غير محددة");

   const edit=document.createElement("button");
   edit.className="edit";
   edit.textContent="تعديل";
   edit.onclick=()=>editMatch(m);

   const del=document.createElement("button");
   del.className="delete";
   del.textContent="حذف";
   del.onclick=()=>deleteMatch(m.id);

   div.append(title,details,edit,del);
   box.appendChild(div);
  });
 }catch(e){
  box.textContent=e.message;
 }
}

async function saveMatch(){
 const data={
  home_team:document.getElementById("home").value.trim(),
  away_team:document.getElementById("away").value.trim(),
  match_date:document.getElementById("date").value,
  match_time:document.getElementById("time").value,
  channel:document.getElementById("channel").value.trim(),
  status:document.getElementById("status").value
 };

 if(!data.home_team||!data.away_team||!data.match_date||!data.match_time){
  document.getElementById("msg").textContent="يرجى تعبئة البيانات المطلوبة";
  return;
 }

 try{
  await request(
   editingId?"/api/admin/matches/"+editingId:"/api/admin/matches",
   {
    method:editingId?"PUT":"POST",
    body:JSON.stringify(data)
   }
  );
  document.getElementById("msg").textContent="تم الحفظ بنجاح";
  resetForm();
  loadMatches();
 }catch(e){
  document.getElementById("msg").textContent=e.message;
 }
}

function editMatch(m){
 editingId=m.id;
 document.getElementById("home").value=m.home_team;
 document.getElementById("away").value=m.away_team;
 document.getElementById("date").value=m.match_date;
 document.getElementById("time").value=m.match_time;
 document.getElementById("channel").value=m.channel||"";
 document.getElementById("status").value=m.status||"upcoming";
 document.getElementById("formTitle").textContent="تعديل المباراة";
 window.scrollTo(0,0);
}

function resetForm(){
 editingId=null;
 ["home","away","date","time","channel"].forEach(id=>{
  document.getElementById(id).value="";
 });
 document.getElementById("status").value="upcoming";
 document.getElementById("formTitle").textContent="إضافة مباراة جديدة";
}

async function deleteMatch(id){
 if(!confirm("هل تريد حذف هذه المباراة؟"))return;
 try{
  await request("/api/admin/matches/"+id,{method:"DELETE"});
  loadMatches();
 }catch(e){alert(e.message);}
}

async function logout(){
 await request("/api/admin/logout",{method:"POST"});
 location.reload();
}
</script>
</body>
</html>`;

function json(data,status=200,headers={}){
 return new Response(JSON.stringify(data),{
  status,
  headers:{
   "Content-Type":"application/json; charset=utf-8",
   ...headers
  }
 });
}

function getCookie(request,name){
 const cookies=request.headers.get("Cookie")||"";
 const item=cookies.split(";").map(x=>x.trim())
  .find(x=>x.startsWith(name+"="));
 return item?item.substring(name.length+1):"";
}

async function sign(value,secret){
 const key=await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(secret),
  {name:"HMAC",hash:"SHA-256"},
  false,
  ["sign"]
 );
 const signature=await crypto.subtle.sign(
  "HMAC",
  key,
  new TextEncoder().encode(value)
 );
 return btoa(String.fromCharCode(...new Uint8Array(signature)))
  .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}

async function authorized(request,env){
 if(!env.ADMIN_PASSWORD)return false;

 const token=getCookie(request,"yah_admin");
 if(!token)return false;

 const parts=token.split(".");
 if(parts.length!==2)return false;

 const expiry=Number(parts[0]);
 if(!Number.isFinite(expiry)||expiry<Date.now())return false;

 const expected=await sign(parts[0],env.ADMIN_PASSWORD);
 return token===parts[0]+"."+expected;
}

async function handle(request,env){
 const url=new URL(request.url);
 const path=url.pathname;
 const method=request.method;

 if(path==="/admin"||path==="/admin/"){
  return new Response(ADMIN_PAGE,{
   headers:{"Content-Type":"text/html; charset=utf-8"}
  });
 }

 if(path==="/api/admin/login"&&method==="POST"){
  if(!env.ADMIN_PASSWORD)
   return json({error:"كلمة المرور غير معدة"},500);

  const body=await request.json().catch(()=>({}));

  if(body.password!==env.ADMIN_PASSWORD)
   return json({error:"كلمة المرور غير صحيحة"},401);

  const expiry=String(Date.now()+8*60*60*1000);
  const signature=await sign(expiry,env.ADMIN_PASSWORD);

  return json({success:true},200,{
   "Set-Cookie":"yah_admin="+expiry+"."+signature+
   "; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800"
  });
 }

 if(path==="/api/admin/logout"&&method==="POST"){
  return json({success:true},200,{
   "Set-Cookie":"yah_admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0"
  });
 }

 if(path==="/api/matches"&&method==="GET"){
  const result=await env.DB.prepare(
   "SELECT * FROM matches ORDER BY match_date,match_time"
  ).all();
  return json({matches:result.results});
 }

 if(path==="/api/admin/matches"||
    path.startsWith("/api/admin/matches/")){

  if(!await authorized(request,env))
   return json({error:"يرجى تسجيل الدخول"},401);

  const parts=path.split("/");
  const id=Number(parts[4]);

  if(method==="GET"){
   const result=await env.DB.prepare(
    "SELECT * FROM matches ORDER BY match_date,match_time"
   ).all();
   return json({matches:result.results});
  }

  if(method==="POST"&&path==="/api/admin/matches"){
   const b=await request.json();

   if(!b.home_team||!b.away_team||!b.match_date||!b.match_time)
    return json({error:"بيانات المباراة ناقصة"},400);

   await env.DB.prepare(
    "INSERT INTO matches (home_team,away_team,match_date,match_time,channel,status) VALUES (?,?,?,?,?,?)"
   ).bind(
    b.home_team,b.away_team,b.match_date,b.match_time,
    b.channel||"",b.status||"upcoming"
   ).run();

   return json({success:true});
  }

  if(method==="PUT"&&id){
   const b=await request.json();

   await env.DB.prepare(
    "UPDATE matches SET home_team=?,away_team=?,match_date=?,match_time=?,channel=?,status=? WHERE id=?"
   ).bind(
    b.home_team,b.away_team,b.match_date,b.match_time,
    b.channel||"",b.status||"upcoming",id
   ).run();

   return json({success:true});
  }

  if(method==="DELETE"&&id){
   await env.DB.prepare(
    "DELETE FROM matches WHERE id=?"
   ).bind(id).run();

   return json({success:true});
  }
 }

 return json({error:"الصفحة غير موجودة"},404);
}

export default {
 async fetch(request,env){
  try{
   return await handle(request,env);
  }catch(error){
   return json({error:"خطأ في الخادم: "+error.message},500);
  }
 }
};
