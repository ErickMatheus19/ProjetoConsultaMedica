var PROS=[
 {id:1,nome:"Dra. Helena Martins",esp:"Clínica geral"},
 {id:2,nome:"Dr. Rafael Costa",esp:"Cardiologia"},
 {id:3,nome:"Dra. Beatriz Lima",esp:"Dermatologia"},
 {id:4,nome:"Dr. André Souza",esp:"Ortopedia"}];
var HORAS=["08:00","08:30","09:00","09:30","10:00","10:30","11:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
var MESES=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
var DIAS=["D","S","T","Q","Q","S","S"];
var mem={};
function ld(k,d){try{var v=localStorage.getItem(k);if(v)return JSON.parse(v)}catch(e){}return mem[k]!==undefined?mem[k]:d}
function sv(k,v){mem[k]=v;try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
var users=ld("ac_users",[]),agds=ld("ac_agds",[]),me=ld("ac_me",null);
var view="home",mode="login",err="",S={d:null,pro:1,h:null,y:0,m:0};
var hoje=new Date();hoje.setHours(0,0,0,0);S.y=hoje.getFullYear();S.m=hoje.getMonth();
var $=function(s){return document.querySelector(s)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function iso(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function br(s){var p=s.split("-");return p[2]+"/"+p[1]+"/"+p[0]}
function toast(t){var e=$("#toast");e.textContent=t;e.hidden=false;setTimeout(function(){e.hidden=true},2600)}
function go(v){if((v==="agendar"||v==="meus")&&!me){v="auth";mode="login"}view=v;err="";render()}
function nav(){
  $("#nav").innerHTML=me?
   '<button class="btn" onclick="go(\'agendar\')">Agendar</button><button class="btn" onclick="go(\'meus\')">Meus agendamentos</button><button class="btn p" onclick="sair()">Sair ('+esc(me.nome.split(" ")[0])+')</button>':
   '<button class="btn" onclick="mode=\'login\';go(\'auth\')">Entrar</button><button class="btn p" onclick="mode=\'cad\';go(\'auth\')">Criar conta</button>';
}
function sair(){me=null;sv("ac_me",null);go("home")}
function home(){
  return '<section class="hero"><div><h1>Sua consulta marcada em poucos cliques.</h1><p>Escolha o dia no calendário, o profissional e o horário. Acompanhe e cancele seus agendamentos quando precisar.</p><button class="btn p" onclick="go(\'agendar\')">Agendar consulta</button></div>'+
  '<div class="mini"><h3>Profissionais</h3>'+PROS.map(function(p){return '<div><span>'+p.nome+'</span><b>'+p.esp+'</b></div>'}).join("")+'</div></section>'+
  '<div class="feats"><div><strong>Crie sua conta</strong><span>Cadastro rápido com e-mail e senha.</span></div><div><strong>Escolha data e horário</strong><span>Horários ocupados aparecem riscados.</span></div><div><strong>Gerencie tudo</strong><span>Veja e cancele seus agendamentos.</span></div></div>';
}
function auth(){
  var c=mode==="cad";
  return '<div class="panel"><h2>'+(c?"Criar conta":"Entrar")+'</h2><p style="color:var(--mut);margin:0">'+(c?"Preencha os dados para agendar consultas.":"Acesse sua conta para agendar.")+'</p>'+
  (c?'<label for="nome">Nome completo</label><input id="nome" autocomplete="name">':'')+
  '<label for="email">E-mail</label><input id="email" type="email" autocomplete="email"><label for="senha">Senha</label><input id="senha" type="password" autocomplete="'+(c?"new-password":"current-password")+'">'+
  '<p class="err" role="alert">'+err+'</p><button class="btn p ok" style="margin-top:6px" onclick="submitAuth()">'+(c?"Criar conta":"Entrar")+'</button>'+
  '<p style="text-align:center;margin:16px 0 0">'+(c?'Já tem conta? <button class="link" onclick="mode=\'login\';err=\'\';render()">Entrar</button>':'Ainda não tem conta? <button class="link" onclick="mode=\'cad\';err=\'\';render()">Criar conta</button>')+'</p></div>';
}
function submitAuth(){
  var email=$("#email").value.trim().toLowerCase(),senha=$("#senha").value,nome=mode==="cad"?$("#nome").value.trim():"";
  if(!email||!senha||(mode==="cad"&&!nome)){err="Preencha todos os campos.";return render()}
  if(mode==="cad"){
    if(senha.length<6){err="A senha precisa ter ao menos 6 caracteres.";return render()}
    if(users.some(function(u){return u.email===email})){err="Este e-mail já está cadastrado. Use Entrar.";return render()}
    var u={nome:nome,email:email,senha:senha};users.push(u);sv("ac_users",users);me=u;
  }else{
    var f=users.filter(function(u){return u.email===email&&u.senha===senha})[0];
    if(!f){err="E-mail ou senha incorretos.";return render()}
    me=f;
  }
  sv("ac_me",me);toast("Bem-vindo(a), "+me.nome.split(" ")[0]+"!");go("agendar");
}
function ocupado(d,pro,h){return agds.some(function(a){return a.data===d&&a.pro===pro&&a.hora===h})}
function agendar(){
  var first=new Date(S.y,S.m,1).getDay(),n=new Date(S.y,S.m+1,0).getDate(),cells="";
  for(var i=0;i<first;i++)cells+="<span></span>";
  for(var d=1;d<=n;d++){
    var dt=new Date(S.y,S.m,d),k=iso(dt),off=dt<hoje||dt.getDay()===0||dt.getDay()===6;
    cells+='<button class="day'+(S.d===k?" sel":"")+'" '+(off?"disabled":"")+' onclick="pickD(\''+k+'\')" aria-label="'+d+' de '+MESES[S.m]+'">'+d+'</button>';
  }
  var slots=HORAS.map(function(h){
    var oc=S.d&&ocupado(S.d,S.pro,h);
    return '<button class="slot'+(S.h===h?" sel":"")+'" '+(oc?"disabled":"")+' onclick="S.h=\''+h+'\';render()">'+h+'</button>'}).join("");
  return '<h2 class="t">Agendar consulta</h2><p style="color:var(--mut);margin:0 0 18px">Atendimento de segunda a sexta.</p><div class="grid">'+
  '<div class="box"><h3>1. Escolha a data</h3><div class="cal-h"><button onclick="mes(-1)" aria-label="Mês anterior">‹</button><span>'+MESES[S.m]+' '+S.y+'</span><button onclick="mes(1)" aria-label="Próximo mês">›</button></div><div class="cal">'+DIAS.map(function(x){return '<small>'+x+'</small>'}).join("")+cells+'</div></div>'+
  '<div class="box"><h3>2. Profissional e horário</h3><label for="pro" style="margin-top:0">Profissional</label><select id="pro" onchange="S.pro=+this.value;S.h=null;render()">'+
  PROS.map(function(p){return '<option value="'+p.id+'"'+(p.id===S.pro?" selected":"")+'>'+p.nome+' — '+p.esp+'</option>'}).join("")+'</select>'+
  '<label>Horário</label>'+(S.d?'<div class="slots">'+slots+'</div>':'<p class="empty">Escolha uma data no calendário.</p>')+
  '<button class="btn p ok" onclick="confirmar()"'+(S.d&&S.h?"":" disabled")+'>Confirmar agendamento</button></div></div>';
}
function pickD(k){S.d=k;S.h=null;render()}
function mes(x){S.m+=x;if(S.m<0){S.m=11;S.y--}if(S.m>11){S.m=0;S.y++}render()}
function confirmar(){
  if(!S.d||!S.h)return;
  if(ocupado(S.d,S.pro,S.h)){toast("Esse horário acabou de ser ocupado.");return render()}
  agds.push({id:Date.now(),email:me.email,data:S.d,hora:S.h,pro:S.pro});sv("ac_agds",agds);
  S.d=null;S.h=null;toast("Consulta agendada!");go("meus");
}
function meus(){
  var l=agds.filter(function(a){return a.email===me.email}).sort(function(a,b){return (a.data+a.hora).localeCompare(b.data+b.hora)});
  return '<h2 class="t">Meus agendamentos</h2><div class="box" style="margin-top:14px">'+(l.length?l.map(function(a){
    var p=PROS.filter(function(x){return x.id===a.pro})[0];
    return '<div class="ag"><div><strong>'+br(a.data)+' às '+a.hora+'</strong><small>'+p.nome+' · '+p.esp+'</small></div><button class="btn" onclick="cancelar('+a.id+')">Cancelar</button></div>'}).join(""):
    '<p class="empty">Você ainda não tem consultas. <button class="link" onclick="go(\'agendar\')">Agendar agora</button></p>')+'</div>';
}
function cancelar(id){if(!confirm("Cancelar esta consulta?"))return;agds=agds.filter(function(a){return a.id!==id});sv("ac_agds",agds);toast("Consulta cancelada.");render()}
function render(){
  nav();
  $("#app").innerHTML=view==="auth"?auth():view==="agendar"?agendar():view==="meus"?meus():home();
}
render();
