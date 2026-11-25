import fs from 'node:fs/promises';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const rows=JSON.parse(await fs.readFile('content.json','utf8'));
const ppt=Presentation.create({slideSize:{width:1280,height:720}});
const C=['#6CE5EC','#92AAFF','#C3A0FF','#67DBD0','#AAB9FF'],white='#F1F5FF',muted='#C2CFE6';
const gr=(a,b)=>({type:'gradient',gradientKind:'linear',angleDeg:28,offsetScale:1,stops:[{offset:0,color:a},{offset:1,color:b}]});
let s,seq=0,group=0;
const name=(kind)=>'b'+group+'_'+kind+'_'+(++seq);
function shape(x,y,w,h,fill,geometry='rect',edge='none',k='shape'){return s.shapes.add({name:name(k),geometry,position:{left:x,top:y,width:w,height:h},fill,line:{fill:edge,width:edge==='none'?0:1,style:'solid'}})}
function tx(t,x,y,w,h,size=25,color=white,bold=false){const a=shape(x,y,w,h,'none','textbox','none','text');a.text=t;a.text.style={typeface:'Aptos',fontSize:size,color,bold,verticalAlignment:'middle',wrap:'wrap',insets:{left:0,right:0,top:0,bottom:0}};return a}
function panel(x,y,w,h){shape(x,y,w,h,gr('#182943','#17213B'),'roundRect','#304360')}
function arrow(x,y,w=25,h=13,kind='rightArrow'){shape(x,y,w,h,C[0],kind,'none','arrow')}
async function pic(file,x,y,w,h){const frame=s.images.add({blob:await fs.readFile(file+'.png'),contentType:'image/png',alt:'b'+group+'_'+file,position:{left:x,top:y,width:w,height:h},fit:'contain'});frame.name=name('image');}
function pair(text){return text.split('|')}
function item(text,x,y,w,i,h=77){const [a,b]=pair(text);shape(x,y+7,4,h-10,C[i%5]);tx(a,x+20,y,w-20,29,24,C[i%5],true);tx(b,x+20,y+33,w-20,h-27,21,muted)}
function heading(title,subtitle,section,n){tx(section.toUpperCase(),55,36,1040,25,17,C[0],true);tx(title,55,82,1170,75,52,white,true);tx(subtitle,57,163,1162,60,26,muted);shape(56,660,1167,1,'#384460');tx('COLLAB COMPILER',56,668,350,22,14,'#94A5BF',true);tx(String(n).padStart(2,'0')+' / 18',1150,668,80,22,14,'#94A5BF')}
function code(t,x,y,w,h,sz=19){tx(t,x,y,w,h,sz,C[0],true)}
for(const [idx,[type,title,sub,parts,note]] of rows.entries()){
s=ppt.slides.add();s.background.fill=gr('#091423','#171930');seq=0;group=0;
const n=idx+1,sect=n<5?'Product overview':n===5?'User journey':n<8?'System design':n<12?'Feature walkthrough':n<15?'System walkthrough':n===15?'Product showcase':n===16?'Engineering decisions':'Roadmap';
if(type==='cover'||type==='close'){
tx(type==='cover'?'COLLABORATIVE DEVELOPMENT ENVIRONMENT':'PROJECT SHOWCASE',62,85,1000,35,19,C[0],true);
group=1;tx(title,60,165,720,130,78,white,true);group=2;tx(sub,64,315,570,145,33,muted);
group=3;if(type==='cover'){panel(681,184,544,346);await pic('editor-detail',692,195,522,324)}else{tx('Questions?',704,239,495,130,70,C[2],true);tx('Thank you',709,369,450,69,31,muted);const source=tx(parts[2],64,546,1150,42,24,C[0]);source.hyperlink={uri:'https://github.com/Atishay-Jain-47/Collab-Compiler',isExternal:true};}
}else{
heading(title,sub,sect,n);
if(type==='cards'||type==='db'){
parts.forEach((p,i)=>{group=i+1;const x=57+i*398;panel(x,262,365,307);const [a,b,c]=pair(p);tx(type==='db'?['ACCOUNT','ROOM','SNAPSHOT'][i]:n===17?['WORKSPACE','EDITOR','INFRASTRUCTURE'][i]:['EDITING','EXECUTION','HISTORY'][i],x+23,288,320,28,16,C[i],true);tx(a,x+23,335,320,64,32,white,true);tx(b,x+23,408,320,c?56:103,23,muted);if(c)tx(c,x+23,473,320,74,19,muted);if(type==='db'&&i)arrow(x-28,392,22,12)});
if(type==='db'){group=0;code('userName → room membership                                      roomId → room snapshots',99,588,1120,36,22)}
}else if(type==='map'){parts.forEach((p,i)=>{group=i+1;let x=60+(i%2)*595,y=251+Math.floor(i/2)*172;panel(x,y,565,147);item(p,x+23,y+21,521,i,102)})}
else if(type==='flow'){const steps=parts.length;parts.forEach((p,i)=>{group=i+1;const x=57+i*237;panel(x,286,213,243);const [a,b]=pair(p);tx('0'+(i+1),x+16,302,177,44,30,C[i],true);tx(a,x+16,362,182,52,26,white,true);tx(b,x+16,419,182,98,21,muted);if(i)arrow(x-23,392,22,13)});
const foot=({5:'Host and partner share a room ID.',8:'CodeMirror → Y.Text → STOMP → Y.applyUpdate → CodeMirror',9:'11 languages   /   15-second execution timeout',14:'HTTP reply → initiating browser → STOMP room broadcast'})[n];group=5;code(foot,59,572,1160,44,23);
}else if(type==='layers'){parts.forEach((p,i)=>{group=i+1;let y=248+i*(parts.length===5?73:115),h=parts.length===5?61:90;panel(59,y,1161,h);const [a,b]=pair(p);tx(a,82,y+4,275,h-8,25,C[i],true);tx(b,367,y+4,830,h-8,23,muted)})}
else if(type==='architecture'){group=1;panel(65,301,282,132);tx('Browser',85,311,245,50,32,white,true);tx('React · CodeMirror · Yjs',85,367,250,48,21,C[0]);group=2;panel(464,301,290,132);tx('Spring Boot',484,311,255,50,32,white,true);tx('REST + STOMP broker',484,367,260,48,21,C[1]);group=3;for(const [i,lab] of ['MongoDB  /  records','Runner  /  programs','Gemini  /  AI requests'].entries()){panel(890,247+i*95,329,76);tx(lab,907,253+i*95,300,64,22,C[i],true)}shape(824,285,3,192,'#6884BC');shape(754,365,72,3,'#6884BC');[285,379,474].forEach(y=>arrow(825,y,60,12));group=4;arrow(351,335,105,14);tx('request',359,296,101,32,17,C[0]);group=5;arrow(351,396,105,14,'leftArrow');tx('response',352,416,111,32,17,C[0]);group=5;code('Room events reach every subscribed client through the broker.',66,555,1150,53,24)}
else if(type==='auth'){const actors=['React browser','Spring Security','MongoDB'];actors.forEach((t,i)=>{const x=95+i*445;tx(t,x,243,290,46,29,C[i],true);shape(x+66,295,2,285,'#334465')});const messages=[[164,606,318,'POST /auth/login',false],[610,1050,385,'Look up user and verify hash',false],[164,606,455,'Signed JWT',true],[164,606,527,'STOMP CONNECT + bearer token',false]];messages.forEach(([x,x2,y,t,rev],i)=>{group=i+1;tx(t,x+24,y-22,x2-x-38,28,20,white,true);arrow(x,y+11,x2-x,10,rev?'leftArrow':'rightArrow')})}
else if(type==='show'){
group=1;panel(57,246,377,245);await pic('login',65,252,361,226);tx('Sign in',59,505,380,44,28,C[0],true);tx('Enter the workspace with a room identity.',59,558,370,66,22,muted);
group=2;panel(462,246,759,365);await pic('editor',473,253,551,344);shape(1030,266,2,315,'#405174');for(const [i,lab] of ['Room controls','Source editor','Input and output'].entries()){tx(lab,1044,278+95*i,167,65,22,C[i],true)}
}
else if(type==='hero'||type==='feature'){
const photo=n===10?'assistant-detail':n===11?'version-detail':'editor';group=1;
if(n===10){panel(115,226,232,410);await pic(photo,124,232,211,403);parts.forEach((p,i)=>{group=i+2;item(p,421,237+i*98,788,i,84)})}
else {const y=n===11?266:238,w=n===11?606:639,h=n===11?338:399;panel(59,y-6,w+12,h+12);await pic(photo,65,y,w,h);parts.forEach((p,i)=>{group=i+2;item(p,737,239+i*(parts.length===4?99:128),478,i,parts.length===4?91:104)})}
}}
s.speakerNotes.text=note;
}
await(await PresentationFile.exportPptx(ppt)).save('base.pptx');
await fs.writeFile('../Presentation/Presentation_Script.md','# Collab Compiler\n\n## Presentation script\n\n'+rows.map((r,i)=>'### '+(i+1)+'. '+r[1]+'\n\n'+r[4]+'\n\n**Presenter cue**  '+(r[0]==='flow'?'Advance one stage at a time. Pause at “'+r[3][2].split('|')[0]+'” before revealing the next step.':r[0]==='feature'?'Point to the captured control first. Then trace each service operation in order.':r[0]==='architecture'?'Reveal the two directions separately. Ask which transport carries a peer update.':r[0]==='auth'?'Follow the arrows in order. Pause after the JWT returns to the browser.':r[0]==='db'?'Follow one username into a room, then one room ID into its version history.':r[0]==='close'?'Invite questions about the edit, run or restore path.':'Pause on each reveal and connect it to the pair-programming example.')).join('\n\n')+'\n');

