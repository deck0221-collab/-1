
'use strict';
/* Original scenario. CoC 7e-inspired percentile rules, not a replacement for the licensed rulebook. */
const KEY='abyss-keeper-v57';
let diceTable=null,diceModule=null,diceBusy=false,diceGeneration=0;
function disposeDice(){diceGeneration++;if(diceTable){try{diceTable.dispose()}catch(e){}diceTable=null}}
async function prepareDice(){
 const host=document.getElementById('dice3d');if(!host||!s.roll||s.tab!=='story')return;
 const generation=++diceGeneration;
 try{
  diceModule=diceModule||await import('./dice3d.js');
  if(generation!==diceGeneration||!host.isConnected||!s.roll||s.tab!=='story')return;
  if(diceTable)try{diceTable.dispose()}catch(e){}
  diceTable=diceModule.createDiceTable(host);
  const b=document.getElementById('roll3d');if(b){b.disabled=false;b.textContent='🎲 3D 주사위 굴리기'}
 }catch(e){const b=document.getElementById('roll3d');if(b){b.textContent='3D 주사위 로딩 오류 · 기본 주사위 사용';b.disabled=false;b.onclick=()=>roll3D(false)}}
}
function diceOutcome(r, n){
 const target=Math.floor(skill(r.skill)/(r.diff==='어려움'?2:r.diff==='극단적'?5:1));
 const k=skill(r.skill);
 if(n===1)return {name:'대성공',kind:'critical'};
 if(n===100||(n>=96&&k<50))return {name:'대실패',kind:'fumble'};
 if(n>target)return {name:'실패',kind:'failure'};
 if(n<=Math.floor(k/5))return {name:'극단적 성공',kind:'extreme'};
 if(n<=Math.floor(k/2))return {name:'어려운 성공',kind:'hard'};
 return {name:'성공',kind:'success'};
}
function showDiceOutcome(r,n){
 const host=document.getElementById('dice3d');
 if(!host)return;
 const outcome=diceOutcome(r,n);
 const previous=host.querySelector('.dice-outcome');if(previous)previous.remove();
 const el=document.createElement('div');el.className='dice-outcome '+outcome.kind;
 el.setAttribute('role','status');el.setAttribute('aria-live','assertive');
 el.innerHTML=`<span class="dice-outcome-label">판정 결과</span><strong>${outcome.name}</strong><span class="dice-outcome-numbers">${String(n).padStart(2,'0')} / ${Math.floor(skill(r.skill)/(r.diff==='어려움'?2:r.diff==='극단적'?5:1))}</span>`;
 host.appendChild(el);
 try{navigator.vibrate?.(outcome.kind==='failure'||outcome.kind==='fumble'?[70,60,130]:[45,35,45])}catch(e){}
}
function waitDice(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function roll3D(useAnimation=true){
 if(diceBusy||!s.roll)return;
 diceBusy=true;
 const pending=s.roll;
 const b=document.getElementById('roll3d');if(b){b.disabled=true;b.textContent='🎲 주사위를 굴리는 중…'}
 try{
  const v=useAnimation&&diceTable?await diceTable.roll():rollValue();
  if(s.roll!==pending)return;
  showDiceOutcome(pending,v);
  await waitDice(1900);
  if(s.roll!==pending)return;
  disposeDice();rollDice(v);
 }catch(e){if(s.roll===pending){const v=rollValue();showDiceOutcome(pending,v);await waitDice(1900);if(s.roll===pending){disposeDice();rollDice(v)}}}
 finally{diceBusy=false}
}

const JOBS=['형사','사진가','택시기사','기자','소방관'];
const JOBDATA={
 형사:{attrs:[65,65,60,65,55,70,65,70],skills:{관찰:70,듣기:60,자료조사:60,설득:55,심리학:55,법률:55,사격:55,회피:50,응급처치:40,추적:50},gear:'손전등, 수첩, 업무용 전화'},
 사진가:{attrs:[50,55,55,75,65,75,70,65],skills:{관찰:75,사진술:80,자료조사:55,은밀행동:55,듣기:60,설득:45,심리학:45,회피:50},gear:'카메라, 예비 배터리, 삼각대'},
 택시기사:{attrs:[60,65,65,65,55,65,60,55],skills:{자동차운전:80,관찰:65,듣기:65,길찾기:70,설득:60,심리학:45,회피:45,응급처치:40},gear:'운행 기록, 차량 블랙박스, 휴대전화'},
 기자:{attrs:[45,55,55,65,65,75,65,75],skills:{자료조사:75,설득:70,관찰:60,심리학:60,듣기:60,사진술:50,은밀행동:45,회피:45},gear:'녹음기, 취재 수첩, 노트북'},
 소방관:{attrs:[75,75,70,70,60,60,65,60],skills:{응급처치:80,관찰:65,듣기:65,기계수리:60,등반:70,근접전투:65,회피:55,길찾기:45},gear:'구조 장비, 방진 마스크, 무전기'}
};
const SKILL_BASE={관찰:25,듣기:20,자료조사:20,설득:10,심리학:10,법률:5,사격:20,회피:20,응급처치:30,추적:10,사진술:5,은밀행동:20,자동차운전:20,길찾기:10,기계수리:10,등반:20,근접전투:25,오컬트:5,크툴루신화:0,정신분석:1,회계:5,역사:5,의학:1,전기수리:10};
const ATTRS=['STR','CON','SIZ','DEX','APP','INT','POW','EDU'];
const CLUES={
 object:'분실된 휴대전화의 잠금 화면에 02:17 부재중 알림이 남아 있다. 소유자는 아직 미확인',
 route:'마지막 운행은 23:41 승차, 23:52 범어동 골목 하차로 기록돼 있다',
 gesture:'승객은 내리기 전 골목 건너편을 두 번 살피며 “기다리는 사람이 있나요?”라고 물었다',
 image:'23:48 촬영한 원본 사진에 공동주택 방향으로 걷는 인물이 찍혀 있다. 신원은 불확실하다',
 mail:'익명 제보 메일에 02:17 녹음과 “세 번째 울림을 세어라”라는 문장이 있다',
 emergency:'119 접수 음성에는 위치를 말하지 못하는 숨소리와 낮은 기계음 세 번이 있다',
 report:'박지민이 이서윤의 실종을 신고했다. 범어동 공동주택 방문 예정은 전언이다',
 audio:'경찰 접수 음성에도 일정 간격으로 세 번 반복되는 기계음이 있다',
 tower:'마지막 통화는 범어동 일대 기지국에 연결됐다. 정확한 건물은 알 수 없다',
 witness:'경비원 오성호는 23시 무렵 비슷한 옷차림의 인물이 복도 안쪽으로 간 것을 봤다고 한다',
 address:'통신 구역, 방문 예약, 제보 위치를 대조해 청운아파트 704호를 확인했다. 실제 출입은 미확정',
 video:'복도 영상에 704호 쪽으로 향한 인물이 찍혀 있다. 얼굴 식별은 어렵다',
 note:'704호에서 “B2 설비실 / 02:17 / 세 번의 신호”라고 적힌 노트와 출입표를 찾았다',
 signal:'설비실 장치의 신호 간격이 신고 음성과 비슷하다. 원인 관계는 미확정',
 victim:'설비실 안쪽에서 의식이 흐릿한 이서윤을 발견했다',
 pattern:'설비 담당자와 제어판의 수동 차단 순서를 확인했다',
 mapEvidence:'공개된 외부 자료로 신호 발생 방향을 좁혔다. 건물 내부 위치는 확인되지 않았다',
 senderEvidence:'삭제 요구 메시지와 게시글의 작성 시각 사이에 모순이 있다',
 archiveEvidence:'공개된 설비 시험 공고가 사건 직후 수정됐다',
 witnessEvidence:'주민이 외부 통로에서 세 차례 금속음과 비상등 점멸을 직접 들었다',
 mechanismEvidence:'세 번의 금속음은 오래된 비상 호출 중계 장치의 시험음과 일치한다',
 admissionEvidence:'시설 관계자가 공개된 점검 시각의 불일치를 인정했다',
 photoTrailClue:'연속 사진에 같은 간격의 소등이 남아 있다. 원인은 확인되지 않았다',
 taxiTrailClue:'본인 블랙박스의 조명 변화가 하차 시각과 일치한다. 탑승자의 신원은 불명이다',
 pressTrailClue:'공개 점검 공고와 제보 음성의 시각이 일치하지 않는다. 주민 증언도 엇갈린다',

 archiveMaster:'구청 공고 원본과 시설관리 업체의 서명된 변경 이력이 다르다. 02:17 시험은 정기 점검에 없었다',
 relayLedger:'중계 장치의 외부 점검 요청 번호가 실제 관리업체의 접수번호와 맞지 않는다',
 routeOverlap:'사진·차량·신고 기록은 같은 건물의 외부 비상 출입구를 가리킨다. 사람의 신원은 미확정이다',
 witnessShift:'야간 근무자의 교대 기록에 02:17에 근무하지 않은 사람이 출입자로 기재됐다',
 voiceLoop:'원본 음성의 끝 0.8초와 시작 0.8초가 파형상 이어진다. 단순 녹음 재생만으로는 설명되지 않는다',
 proofChain:'원본 파일 해시·공개 공고·독립 증언의 출처가 각각 보존됐다',
 safetyPlan:'현장 접근 없이 담당 기관에 비상 출입구의 위험을 통보하고 확인 절차를 요청했다',
 humanLink:'점검 기록을 조작한 사람의 행동과 중계 장치의 고장 징후를 구분했다'
};
const DESC={
 intro:'대구의 늦은 밤. 평범하게 시작된 근무와 일상 속에서 작은 이상이 발견된다. 무엇이 사건인지, 서로 연결되는지는 아직 아무도 모른다.',
 police:'수사팀에 실종 신고가 배당됐다. 신고서에는 신고자 박지민과 실종자 이서윤의 관계가 지인으로 기재돼 있다. 박지민은 이서윤과 전날 밤부터 연락이 끊겼다고 말한다. 방문 예정 장소는 아직 진술만 있을 뿐 확인되지 않았다. 김도현 경사가 별도로 접수된 불명확한 음성 제보의 관련성을 검토 중이다.',policeBrief:'박지민이 남긴 연락 시도 기록과 마지막 메시지를 확인한다. ‘범어동에 잠깐 들른다’는 문장만으로 정확한 주소나 범죄 발생 여부를 확정할 수 없다. 실종자의 안전을 확인하는 절차부터 진행해야 한다.',
 photo:'어젯밤 범어동에서 찍은 거리 사진을 정리한다. 골목 끝에 행인 한 명이 찍혀 있지만 특별한 장면은 아니다. 오늘은 촬영본을 정리하고 집으로 돌아갈 생각이다.' , photoNotice:'다음 날, 동네 소식 게시판에 박지민이 올린 실종자 수색 협조 글이 올라왔다. 글에는 박지민의 지인인 이서윤이라는 사람이 어젯밤 범어동 일대에서 마지막으로 연락됐다고 한다. 사진에 찍힌 행인이 실종자인지는 알 수 없다. 다만 촬영 시간과 장소를 확인해 볼 이유는 생겼다.',photoCompare:'게시글에는 실종자가 마지막으로 입었다는 짙은 외투와 가방의 특징이 적혀 있다. 사진을 확대해도 얼굴은 보이지 않는다. 촬영 위치가 마지막 연락 지역과 가깝다는 사실만 확인할 수 있다. 이제 사진을 경찰에 전달할지 결정할 수 있다.',
 taxi:'야간 운행을 마치고 차고지에서 뒷좌석을 청소하다 잠긴 휴대전화를 발견했다. 어느 승객의 물건인지 확신할 수 없다. 분실물로 처리하려면 운행 시간과 인계 기록을 남겨야 한다.',taxiRecord:'운행 앱의 마지막 세 건을 확인한다. 범어동 골목에서 내린 승객이 있었지만, 휴대전화를 두고 내린 사람인지는 확인되지 않는다. 휴대전화는 잠겨 있어 통화 내역을 열어 볼 수 없다.',taxiNotice:'다음 날 택시조합 분실물 접수 창구에서 경찰 인계를 안내한다. 같은 날 지역 커뮤니티에는 박지민이 지인 이서윤의 실종을 알리며 범어동 일대 목격자를 찾는 게시물이 올라온다. 시간대가 겹칠 수 있지만 두 사건이 관련됐다는 증거는 없다.',taxiHandoff:'분실물 인계서에 발견 시각과 운행 정보를 적고 휴대전화를 경찰에 전달한다. 경찰은 소유자 확인 전까지 실종 사건과 연결해 설명할 수 없다고 말한다.',
 press:'지역신문사 사회부 당직. 광고성 제보와 민원이 쌓인 메일함에 발신자 표시가 없는 음성 파일 하나가 들어왔다. 제목은 ‘02:17’. 아직 범죄 제보인지 장난인지 판단할 근거가 없다.',pressScreen:'메일 헤더에는 발송 경로가 일부만 남아 있고, 음성에는 기계음과 숨소리가 섞여 있다. 특정 인물이나 장소를 지목하는 내용은 없다. 확인되지 않은 파일을 기사화할 수는 없다.',pressLead:'다음 날 실종자의 지인 박지민이 공개한 수색 게시물에는 이서윤의 마지막 연락 시각이 새벽 2시 무렵으로 적혀 있다. 익명 음성 파일과 시각이 비슷하다는 사실만으로 같은 사건이라 단정할 수 없다. 담당자에게 사실 확인을 요청할지는 당신의 몫이다.',
 fire:'119안전센터 야간 근무. 상황실에서 신고자의 말을 알아듣기 어렵고 위치가 불분명한 신고를 전달했다. 출동 주소가 아직 특정되지 않아 임의로 건물을 수색할 수 없다. 상황실이 재통화와 위치 확인을 진행 중이다.',fireDispatch:'상황실이 신고 시각과 통신 연결 구역을 재확인한다. 범어동 일대라는 넓은 구역만 확인됐으며 현장 주소는 여전히 미정이다. 지휘자의 출동 지시가 내려오기 전에는 구조 장비를 점검하고 대기한다.',fireLink:'상황실에서 경찰 공조 회신이 왔다. 박지민이 지인 이서윤에 대한 실종 신고를 했다는 경찰의 공조 요지가 전달됐다. 하지만 신고 음성의 주인이 실종자라는 확인은 없다. 경찰이 방문 예정 장소를 별도로 확인하고 있으며 구조대는 안전 위험 가능성에 대비한다.',
 hub:'확인한 사실을 바탕으로 다음 행동을 정한다. 지금까지 얻은 단서는 수사 노트에 남아 있다.',
 apartment:'청운아파트. 관리인 최은정이 현관에서 기다린다. 경찰이 확인한 실종 신고와 긴급 위험 가능성 때문에 관계자들이 현장에 모였다.',
 floor:'7층 복도. 704호에서는 아무런 대답이 없다. 복도 끝 전등이 세 번 깜빡인다.',
 room:'704호 내부는 정리돼 있지만 누군가 서둘러 떠난 흔적이 있다. 책상에는 노트가, 바닥에는 낡은 출입표가 떨어져 있다.',
 basement:'지하 2층 설비실 앞. 문 너머로 일정한 간격의 금속음이 들린다. 구조대와 설비 담당자가 곁에 있다.',
 victim:'기계 뒤편에서 이서윤을 발견했다. 호흡은 있으나 의식이 흐릿하다. 구조대가 들것을 준비한다.',
 photoTrail:'사진 속 행인은 여전히 신원을 알 수 없다. 원본의 촬영 순서와 골목의 고정된 간판을 기준으로 보행 방향을 추정할 수 있을까? 빛의 이상 여부는 아직 판단할 근거가 없다.',
 photoWitness:'촬영 장소를 다시 찾았다. 가게 주인은 사진의 간판 위치와 행인이 걸어간 방향을 확인해 준다. 대화를 나누던 중 그날 밤 가게 조명이 잠깐 깜빡였다는 기억도 덧붙인다. 그 말이 사실인지는 아직 알 수 없다.',
 photoSignal:'연속 촬영한 세 장 모두 전등이 같은 간격으로 꺼져 있다. 사진 파일의 시간 정보는 남아 있지만, 원인은 불명이다. 경찰에 사진 원본을 전달한 뒤에도 사진작가인 당신에게만 남아 있는 질문이다.',
 taxiTrail:'경찰에 분실물을 인계한 뒤, 택시조합에서 같은 시간대 범어동 우회 운행에 관한 공개 안내를 받았다. 누군가의 개인정보가 아니라 자신의 블랙박스와 운행 기록만 살펴볼 수 있다.',
 taxiWitness:'단골 편의점 주인은 그날 밤 아파트 쪽 도로가 갑자기 어두워졌다고 기억한다. 승객의 신원은 여전히 불확실하지만, 하차 위치와 정전 시간의 관계를 확인할 수 있다.',
 taxiSignal:'블랙박스에는 차 안 라디오 잡음과 도로 조명 소등이 동시에 남아 있다. 주행 영상은 당신의 것이지만, 촬영된 사람의 신원은 함부로 공개할 수 없다.',
 pressTrail:'경찰에 파일을 넘겼다고 취재가 끝나는 건 아니다. 당신은 공개된 전력 점검 공고와 제보 파일의 시간대를 비교한다. 자료에는 주민 개인정보가 없다.',
 pressWitness:'아파트 입주민 대표는 같은 시각 비상등이 세 번 꺼졌다고 증언한다. 그러나 다른 주민은 정전 자체를 기억하지 못한다. 두 증언을 검증하지 않으면 기사로 쓸 수 없다.',
 pressSignal:'전력 점검 공고의 시각과 녹음의 반복 신호는 어긋난다. 익명 제보자는 왜 점검이 없는 시간에 세 번의 소리를 녹음했을까? 보도할 사실과 확인되지 않은 추측을 구분해야 한다.',
 civilianChoice:'당신은 경찰의 통제선 밖에 있다. 하지만 자신의 원본 자료, 직접 들은 증언, 공개 기록을 비교해 독립적으로 확인한 사실이 생겼다. 새벽 2시 17분, 휴대전화에 발신자 없는 전화가 울린다. 받거나 끊는 것은 당신의 선택이다.',
 civilianCall:'수화기에서는 자신의 목소리와 비슷한 숨소리, 세 번의 금속음이 들린다. 누군가 당신의 이름을 속삭인다. 그 음성이 실제 사람의 것인지, 조작된 파일인지 알 수 없다. 증거를 보존할지, 위험을 감수하고 끝까지 들을지 결정해야 한다.',
 civilianResolve:'다음 날 아침. 경찰은 자료 접수 사실만 확인해 준다. 당신의 전화 수신 여부와 무관하게, 원본 기록에 남은 세 차례의 신호는 설명되지 않았다. 이제 자신의 자료를 바탕으로 후속 검증을 진행할 수 있다.',
 photoArchive:'작업실에서 원본을 다시 불러온다. 23:48 전후의 연속 사진 다섯 장 중 네 번째에만 간판 반사광이 사라져 있다. 촬영 순서를 확인하면 단순한 노출 변화인지 판단할 수 있다.',
 photoShop:'사진을 촬영한 골목의 가게는 아직 영업 중이다. 주인은 정전이 아니라 누군가 전기실 문을 열어둔 탓에 비상등이 깜빡였다고 기억한다. 기억의 정확성을 확인할 자료는 영업 일지뿐이다.',
 photoDecision:'사진 원본과 가게의 영업 일지는 같은 23:48을 가리킨다. 사진 속 행인의 신원은 불확실하지만 전등이 꺼진 위치는 특정된다. 경찰에 이 위치를 알릴지, 먼저 공개된 건물 배치도를 대조할지 선택할 수 있다.',
 taxiDispatch:'분실물은 인계했다. 그런데 자신의 운행 앱에 같은 골목으로 가는 호출이 23:55에 취소된 기록이 남아 있다. 승객의 개인정보가 아닌 자신의 호출 이력이다.',
 taxiRoad:'우회도로의 공사 안내와 블랙박스 영상을 대조하자 23:52에 길이 막혔다는 사실을 확인했다. 골목으로 걸어간 사람은 한 명이 아니었다. 차량 영상에 남은 것은 옷차림과 이동 방향뿐이다.',
 taxiDecision:'경찰은 분실물 소유자와 탑승자가 동일하다고 확인해 주지 않았다. 그러나 자신의 운행 영상에는 다른 차량의 비상등이 세 번 점멸하는 모습이 남았다. 영상을 원본 그대로 제출할지, 추가 목격자를 찾을지 결정해야 한다.',
 pressSource:'익명 파일의 작성자는 신원을 밝히지 않는다. 대신 공개된 건물 안전 점검 공고를 찾아보라는 두 번째 메일을 보냈다. 이 제보가 사실인지, 누군가 취재를 조종하는지는 알 수 없다.',
 pressConflict:'관리사무소의 공개 공고에는 그날 점검이 없었다. 입주민 대표는 세 번 정전됐다고 주장하지만 다른 주민은 전혀 기억하지 못한다. 두 증언은 동시에 사실일 수 있다. 서로 다른 동을 말하는 것일지도 모른다.',
 pressDecision:'당신은 확인된 사실과 미확인 주장을 분리해 정리했다. 제보자가 보낸 파일의 원본성은 확인되지 않았지만, 공개 공고와 주민 증언의 불일치는 기사 가치가 있다. 보도 전에 반론을 요청할지 판단해야 한다.',
 civilianFollow:'경찰에 자료를 전달한 뒤에도 원본은 당신에게 남아 있다. 공개된 자료와 자신의 기록을 비교하자 세 번의 신호가 각기 다른 장치에서 같은 간격으로 반복된다는 의문이 생긴다. 우연일 수도 있다. 어떤 기록을 먼저 검증할까?',
 civilianCross:'자료를 교차 대조했다. 사진의 시간 정보, 차량 영상의 소리, 익명 음성 파일은 서로 다른 출처다. 당신이 실제로 가진 자료만으로 확정할 수 있는 것은 신호의 반복 간격뿐이다. 누군가 공개 게시판에 같은 간격을 묘사한 글을 남겼다.',
 civilianContact:'게시글 작성자는 자신이 실종자를 봤다고 주장하지 않는다. 다만 폐쇄된 상가 통로에서 세 번 울리는 금속음을 들었다고 한다. 현장 접근 권한은 없다. 작성자에게 공개된 장소에서 만나자고 제안하거나, 제보 내용을 문서로만 받을 수 있다.',
 civilianMeeting:'사람이 많은 카페에서 만난 작성자는 상가 통로의 외부 안내판 사진을 보여준다. 사진에는 임시 폐쇄 공지가 붙어 있다. 그는 안으로 들어간 적이 없다고 한다. 그때 당신의 휴대전화에 같은 간격의 진동이 세 번 울린다.',
 civilianPattern:'당신이 직접 확인한 것은 공개 안내판, 원본 파일의 시각, 반복 신호의 간격이다. 건물 안에 무엇이 있는지는 모른다. 그럼에도 누군가 원본을 삭제하라는 익명 메시지를 보냈다. 증거를 안전하게 보존하고 경찰에 위협 사실을 알릴 수 있다.',
 civilianFinal:'기록을 보존할 것인가, 공개할 것인가. 당신은 수사기관의 결론을 알 수 없지만, 스스로 확인한 사실의 신뢰도와 자신의 안전에 대한 판단은 할 수 있다. 마지막 선택은 지금까지의 검증 결과와 전화에 대응한 방식에 따라 달라진다.',
 truthMap:'시간표를 펼친다. 23:48의 불빛, 23:52의 차량, 02:17의 세 번 울린 음성은 서로 다른 시각이다. 같은 사건이라는 보장은 없다. 우선 각 기록이 가리키는 장소를 분리해 확인한다.',
 truthSender:'삭제 요구 메시지에는 발신자 이름이 없다. 보낸 사람이 사건 관계자라는 근거도 없다. 공개 게시판의 최초 작성 시각과 비교하면 거짓 제보를 걸러낼 수 있을지 모른다.',
 truthArchive:'구청 공개 자료에 청운아파트 지하 설비의 정기 시험 공고가 있다. 공고는 전날 수정됐다. 원래 공고와 수정본의 시간대가 다르다. 누가 왜 수정했는지는 공개 기록만으로 알 수 없다.',
 truthWitness:'게시글 작성자는 실종자를 봤다고 하지 않았다. 다만 지하 설비실 외부 통로에서 금속음 세 번과 비상등 점멸을 목격했다. 그는 직원이 아닌 주민이다. 기억과 기록을 구분해야 한다.',
 truthTheory:'신호 간격은 설비 시험음의 규격과 닮았다. 하지만 신고 음성에 섞인 숨소리와 내 목소리는 설명되지 않는다. 전기 설비의 시험과 실종 사건이 실제로 연결됐는지 판단하려면 독립된 근거가 더 필요하다.',
 truthRevelation:'자료들이 가리키는 공통 후보는 청운아파트의 오래된 비상 호출 중계 장치다. 같은 간격의 시험음과 공개 점검 공고 수정 사실은 확인 대상이지만, 장치가 실제로 고장 났는지와 실종의 원인은 아직 입증되지 않았다. 이서윤이 왜 그 장소에 갔는지와 목소리의 출처 역시 미확정이다. 이제 설비 기록의 보존을 요구할 근거가 생겼다.',
 truthConfront:'시설 관리자는 외부에 공개된 점검 시간과 실제 시험 시각이 달랐음을 인정할 수도, 답변을 거절할 수도 있다. 관리 기록을 임의로 열람할 권한은 없다. 확인 가능한 질문만 해야 한다.',
 truthChoice:'당신은 신호의 기계적 원인으로 의심되는 장치와 공개 기록의 모순을 어느 정도 밝혀냈다. 그러나 이서윤의 상태는 경찰과 구조대의 확인 사항이고, 자신을 닮은 목소리는 여전히 설명되지 않는다. 사실 공개와 피해자 보호, 남은 위험 사이에서 최종 판단한다.',
 policeReview:'박지민의 신고서와 마지막 연락 내역을 대조한다. 02:17은 연락이 끊긴 시각이 아니라 부재중 전화가 기록된 시각이다. 실종 발생 시점으로 단정하면 안 된다.',
 policeInterview:'박지민은 이서윤이 청운아파트에 물건을 가지러 간다고 말했다고 진술한다. 직접 목격한 것이 아니라 이서윤에게 들은 말이다. 통신 구역과 건물 방문 기록을 별도로 확인해야 한다.',
 fireSafety:'상황실은 신고 위치를 범어동 일대로 좁혔다. 건물 내부 진입은 경찰 공조와 지휘자의 지시가 필요한 상황이다. 그 사이 구조대는 밀폐 공간 구조에 필요한 산소측정기와 보호구를 점검한다.',
 fireAssessment:'현장에 도착한 뒤 설비 담당자가 지하 2층 환기 불량을 보고한다. 실종자 구조가 우선이지만 무리하게 들어가면 구조대까지 위험해질 수 있다. 먼저 대기 중인 동료와 진입 절차를 확인한다.',


 chapter2:'제2막 · 사라진 17분. 설비 시험의 흔적은 발견했지만 이서윤의 실종 경위는 여전히 설명되지 않는다. 어제 02:00부터 02:17까지 기록이 비어 있다. 누구의 기록을 믿을지, 무엇부터 검증할지 선택해야 한다.',
 archiveDesk:'공개 공고의 이전 버전에는 점검 시작 시각이 02:00으로 기재돼 있다. 현재 버전은 03:00이다. 수정자는 시설 관리업체로 표시되지만 수정 사유는 비어 있다. 관리업체의 원본은 요청할 수 있으나 열람을 강제할 수는 없다.',
 archiveAnswer:'관리업체 담당자는 외부에 공개 가능한 접수번호를 알려 준다. 그런데 번호 체계가 실제 접수 양식과 다르다. 단순 오기일 수도, 제3자가 요청서를 꾸몄을 수도 있다.',
 routeDesk:'촬영 장소, 하차 지점, 공개 신고 위치를 지도에 표시한다. 세 지점은 같은 건물 주변에 있지만 시각이 다르다. 사건을 하나로 묶으려면 외부 출입구의 실제 동선을 확인해야 한다.',
 routeAnswer:'외부 통로의 공공 안내도와 사진을 비교하자 비상 출입구가 확인된다. 출입구는 잠겨 있다. 내부로 들어갈 권한은 없으며, 담당 기관에 위험을 알리는 것이 합법적인 다음 단계다.',
 voiceDesk:'녹음 원본의 앞뒤 파형을 비교한다. 시작과 끝이 이어지도록 편집된 흔적은 없는데, 두 구간의 배경음이 완전히 연속된다. 자동 반복 장치의 오작동인지, 누군가 원본을 변조했는지는 더 확인해야 한다.',
 voiceAnswer:'오래된 비상 호출 중계기는 통화 실패 시 마지막 17초를 임시 저장한다. 그러나 보존된 파일에는 아직 녹음하지 않은 듯한 당신의 말투가 들어 있다. 확인된 기계적 현상과 설명할 수 없는 현상을 구분해야 한다.',
 chapter3:'제3막 · 지워진 교대 기록. 공개된 근무 교대표에는 사건 당시 출입하지 않았다는 직원의 이름이 남아 있다. 누군가 관리 기록을 고쳤다는 의혹이 생겼지만 그 사람이 실종에 관여했다는 증거는 없다.',
 workerInterview:'시설 직원은 교대표의 자신의 서명이 복사된 것 같다고 주장한다. 근무 당일 출입증을 분실했다고도 한다. 진술만으로 범행을 단정하지 말고, 실제 출입기록의 보존을 요청해야 한다.',
 workerConflict:'관리업체는 원본 기록 보존 요청을 받았지만 개인정보 때문에 전체 출입 명단은 제공할 수 없다고 답한다. 대신 위조 의심 서명과 공개 점검 요청번호에 관한 사실확인서를 발급할 수 있다.',
 safetyChoice:'건물 비상 출입구에서 금속음이 세 번 울린다. 그곳은 안전 점검 전 출입 금지 구역이다. 무단 진입하면 본인도 위험해지고 기록의 증거 능력도 훼손될 수 있다. 지금 필요한 건 영웅적인 돌진이 아니라 구조 가능성을 높이는 판단이다.',
 officialSafety:'현장 담당자는 공식 공조 절차를 통해 구조대의 안전 확인과 설비 기록 보존을 지시한다. 경찰은 출입 관련 증거를, 소방은 밀폐 공간 위험과 구조 동선을 각각 맡는다.',
 civilSafety:'당신은 외부에서 위험 신호를 기록하고 관리주체·119·경찰에 정확한 위치와 시간을 알린다. 출입 통제선 안으로 들어가지 않고도 구조에 필요한 정보를 제공할 수 있다.',
 chapter4:'제4막 · 두 종류의 진실. 점검 기록을 누군가 바꾼 것은 사람의 행동이다. 그러나 통화 파일의 시간 역전 현상은 그 조작만으로 설명되지 않는다. 두 사건을 섞어 성급한 결론을 내리면 진상을 놓친다.',
 chainReview:'확보한 단서의 출처를 다시 정리한다. 공개 공고 수정 이력, 녹음 원본, 목격자 진술은 서로 독립적인가? 한 사람의 익명 제보에서 파생된 정보라면 세 개의 증거처럼 세어서는 안 된다.',
 chainChallenge:'시설 측은 음성 파일이 조작됐다고 반박한다. 음성의 초자연적 부분은 재현되지 않지만 공고 변경 이력과 허위 접수번호는 별도로 검증할 수 있다. 무엇을 사실로 발표할지 결정해야 한다.',
 finalReveal:'확인 가능한 사실이 모였다. 허위 점검 요청이 중계 장치를 시험 상태로 남겨 두었고, 그 때문에 비상 호출이 정상 전달되지 않았을 가능성이 높다. 이서윤이 위험에 처한 정확한 경위는 구조 기록과 본인 진술로 확인해야 한다. 한편 장치의 17초 음성에는 아직 하지 않은 문장이 기록돼 있다.',
 epilogue:'조사 결과를 어떻게 남길 것인가. 공개하면 안전 문제를 바로잡을 수 있지만 피해자의 사생활을 해칠 수 있다. 비공개로 넘기면 증거 보존은 가능하지만 책임 규명이 늦어질 수 있다. 음성의 마지막 17초를 다시 듣는 일에는 이성의 대가가 따른다.',
 verification:'담당자가 제보를 접수하고 원본의 시간·출처를 확인한다. 사건 관련성은 아직 미확정이다. 확인 가능한 범위의 결과만 제보자에게 전달된다.',civilian:'현장 통제선 밖. 당신이 할 수 있는 일은 확인한 자료를 전달하고, 경찰과 구조대의 안전 조치를 방해하지 않는 것이다.',civilianEnd:'제보 이후 몇 시간이 지났다. 담당자는 접수 사실과 확인 가능한 내용만 전달했다. 실종자의 현재 위치나 수사 진행 상황은 알려주지 않았다.',final:'설비실 안쪽에서 세 번째 신호가 울린다. 구조대를 기다리는 동안 장치가 낮게 진동한다. 안전을 확보한 뒤 무엇을 할지 결정해야 한다.'
};
function fresh(){return {version:57,name:'',job:'',scene:'intro',tab:'story',facts:[],notes:[],logs:[],visited:[],hp:0,maxhp:0,san:0,maxsan:0,mp:0,luck:0,attrs:[],skills:{},roll:null,flags:{},turn:0,ended:false,ending:'',damage:0,insanity:false,episode:0,indefinite:false,temporary:0,majorWound:false,dying:false,stabilized:false,combat:null,chase:null,advancement:{},experience:0,growthReport:null,inventory:[],credit:40,backstory:'',bonds:[],round:0,endingText:''}};
let s;try{s=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('abyss-keeper-v54'))||fresh();if(s.version!==57){if([53,54,55,56].includes(s.version)){s.version=57;s.growthReport=s.growthReport||null}else s=fresh()}}catch(e){s=fresh()}
if(s.roll){s.roll=null;s.logs.push({kind:'시스템',msg:'이전 판정이 중단되어 취소되었습니다. 행동을 다시 선택하세요.'})}
const $=q=>document.querySelector(q);
const esc=t=>String(t).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
function save(){try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
function log(kind,msg){s.logs.push({kind,msg,turn:s.turn});if(s.logs.length>300)s.logs.shift()}
function clue(id,source){if(!s.facts.includes(id)){s.facts.push(id);s.notes.push({id,source});log('단서',CLUES[id]+' | 출처: '+source)}}
function visit(id){s.tab='story';if(s.temporary>0){s.temporary--;if(!s.temporary&&!s.indefinite)s.insanity=false;}s.scene=id;s.turn++;if(!s.visited.includes(id))s.visited.push(id);log('장면',id+' — '+DESC[id]);save();render()}
function stat(k){return s.attrs[ATTRS.indexOf(k)]||50}
function skill(k){return s.skills[k]??SKILL_BASE[k]??10}
function init(name,job){s=fresh();s.name=name;s.job=job;s.attrs=[...JOBDATA[job].attrs];s.skills={...JOBDATA[job].skills};s.maxhp=Math.floor((stat('CON')+stat('SIZ'))/10);s.hp=s.maxhp;s.maxsan=stat('POW');s.san=s.maxsan;s.mp=Math.floor(stat('POW')/5);s.luck=50;s.inventory=JOBDATA[job].gear.split(', ');s.credit=job==='형사'?50:job==='기자'?45:35;s.backstory='직업에 따른 평범한 일상에서 출발한다. 사건과의 관련성은 플레이하며 확인한다.';log('조사자',`${name} / ${job} / HP ${s.hp} / SAN ${s.san}`);visit({형사:'police',사진가:'photo',택시기사:'taxi',기자:'press',소방관:'fire'}[job])}
function damage(n,why){if(s.ended)return;s.hp=Math.max(0,s.hp-n);log('체력',`${why}: HP -${n}`);try{navigator.vibrate?.([150,70,180])}catch(e){}if(n>=Math.ceil(s.maxhp/2)){s.majorWound=true;log('중상','한 번에 최대 HP의 절반 이상을 잃어 중상을 입었다.');}if(s.hp===0){if(s.majorWound){s.dying=true;s.scene='critical';log('위독','응급처치로 안정화하지 않으면 위험하다.');save();render()}else ending('unconscious')}}
function sanLoss(n,why){if(n<=0||s.ended)return;s.san=Math.max(0,s.san-n);s.episode=(s.episode||0)+n;log('이성',`${why}: SAN -${n}`);if(n>=5){s.insanity=true;s.temporary=3;log('광기','일시적 광기 발생. 세 번의 장면 전환 동안 판정에 불이익 주사위가 적용된다.')}if(s.episode>=Math.floor(s.maxsan/5)){s.indefinite=true;s.insanity=true;s.temporary=Math.max(s.temporary||0,5);log('광기','짧은 기간 동안 이성의 1/5 이상을 잃어 부정기적 광기 상태가 되었다.')}if(s.san===0)ending('insane')}
function ending(id){s.tab='story';s.ended=true;s.ending=id;s.roll=null;s.scene='ending';s.turn++;log('결말',id);save();render()}
function act(id){
 if(s.ended||s.roll)return;
 const opts=options().filter(o=>o.ok!==false);
 const o=opts[id];if(!o)return;
 log('선택',o.label);
 o.go();save();render();
}
function check(skillName,diff,success,failure,extra={}){
 s.roll={skill:skillName,diff,success,failure,push:false,bonus:extra.bonus||0,penalty:(extra.penalty||0)+(s.insanity?1:0),risk:extra.risk||'',label:extra.label||skillName};
 s.tab='story';save();render();
}
function rollValue(){return Math.floor(Math.random()*100)+1}
function rollDice(forcedValue=null){
 if(!s.roll||diceBusy&&forcedValue===null)return;
 if(forcedValue===null)disposeDice();
 const r=s.roll;
 const base=forcedValue===null?rollValue():forcedValue;const ones=base%10;const tens=Math.floor(base/10)%10;const rolls=[base];for(let i=0;i<Math.min(2,Math.abs(r.bonus-r.penalty));i++){const t=Math.floor(Math.random()*10);rolls.push(t===0&&ones===0?100:t*10+ones)}
 const value=r.bonus>r.penalty?Math.min(...rolls):r.penalty>r.bonus?Math.max(...rolls):rolls[0];
 const target=Math.floor(skill(r.skill)/(r.diff==='어려움'?2:r.diff==='극단적'?5:1));
 const success=value===1||(value<=target && !(value>=96 && skill(r.skill)<50));const critical=value===1;const fumble=value===100||(value>=96&&skill(r.skill)<50);
 log('주사위',`${r.skill} ${r.diff} ${value}/${target} (${rolls.join(', ')}) ${critical?'대성공':fumble?'대실패':success?'성공':'실패'}${r.push?' · 강행':''}`);
 s.roll=null;if(success){s.advancement[r.skill]=true;}
 if(success)result(r.success);else if(r.push){damage(2,'강행 판정 실패');if(!s.ended){sanLoss(2,'강행 실패의 충격');if(!s.ended)result(r.failure)}}else{
   s.roll={...r,value,target,pushAvailable:!r.push};
   s.tab='result';save();render();return;
 }
 save();render();
}
function result(id){
 switch(id){
 case 'route':clue('route','택시기사 본인 운행 기록');visit('taxiRecord');break;
 case 'gesture':clue('gesture','승객 하차 당시 기억');visit('taxiRecord');break;
 case 'image':clue('image','사진 원본의 촬영 시각·위치');visit('hub');break;
 case 'mail':clue('mail','업무용 메일 원본');visit('pressLead');break;
 case 'emergency':clue('emergency','119 상황실 접수 음성');visit('fireDispatch');break;
 case 'audio':clue('audio','김도현 경사의 접수 음성');visit('hub');break;
 case 'report':clue('report',s.job==='형사'?'실종 신고자 박지민의 직접 진술':'상황실을 통한 경찰 공조 요지');visit('hub');break;
 case 'tower':clue('tower',s.job==='형사'?'경찰이 확보한 통신사 회신':'상황실을 통한 위치 확인 요지');visit('hub');break;
 case 'witness':clue('witness','경비원 오성호의 진술');visit('apartment');break;
 case 'video':clue('video','관리사무소 보존 복도 영상');visit('apartment');break;
 case 'note':clue('note','704호 책상과 출입표');visit('room');break;
 case 'signal':clue('signal','설비실 현장 소리와 녹음 대조');visit('basement');break;
 case 'pattern':clue('pattern','설비 담당자의 제어판 확인');visit('basement');break;
 case 'victim':clue('victim','구조대와 함께 현장에서 직접 발견');sanLoss(1,'실종자의 상태');visit('victim');break;
 case 'photoBlur':log('판정 결과','사진이 흐리지만 골목의 방향과 촬영 시각은 확인했다.');clue('image','사진 원본 메타데이터');visit('hub');break;
 case 'taxiBlur':log('판정 결과','세부 기억은 흐릿하다. 운행 기록의 시각만 확인했다.');clue('route','택시 운행 기록');visit('taxiRecord');break;
 case 'mailBlur':log('판정 결과','파일의 출처는 확인하지 못했지만 첨부된 음성은 보존했다.');clue('mail','제보 메일 첨부파일');visit('pressLead');break;
 case 'emergencyBlur':log('판정 결과','신고자의 말은 알아듣지 못했지만 세 번 반복되는 기계음을 확인했다.');clue('emergency','119 접수 음성');visit('fireDispatch');break;
 case 'audioBlur':log('판정 결과','발신자 신원은 불명이나 기계음의 반복을 들었다.');clue('audio','경찰 접수 음성');visit('hub');break;
 case 'reportBlur':log('판정 결과','신고자의 불안을 달래지는 못했지만 방문 예정이라는 진술을 확보했다.');clue('report','박지민 진술');visit('hub');break;
 case 'towerBlur':log('판정 결과','분석에 실패했지만 담당 형사가 통신사에 재확인해 범어동 일대를 확인했다.');clue('tower','통신사 재확인');visit('hub');break;
 case 'witnessBlur':log('판정 결과','경비원은 얼굴을 알아보지 못했다. 복도 쪽으로 간 사람은 있었다고 한다.');clue('witness','경비원 진술');visit('apartment');break;
 case 'videoBlur':log('판정 결과','얼굴은 식별되지 않는다. 704호 쪽으로 이동한 동선만 확인했다.');clue('video','복도 영상');visit('apartment');break;
 case 'noteBlur':damage(1,'깨진 유리');if(!s.ended){clue('note','704호 현장 노트');visit('room')}break;
 case 'signalBlur':sanLoss(2,'이해할 수 없는 소리');if(!s.ended){clue('signal','설비실 기계음');visit('basement')}break;
 case 'patternBlur':sanLoss(2,'제어판에 겹쳐 보이는 문자');if(!s.ended)visit('basement');break;
 case 'victimBlur':damage(2,'붕괴한 선반');if(!s.ended){clue('victim','구조대가 수색 중 발견');sanLoss(2,'실종자의 상태');visit('victim')}break;
 case 'photoArchiveGood':clue('photoTrailClue','연속 사진 EXIF와 간판 반사광');s.flags.photoVerified=true;visit('photoShop');break;
 case 'photoArchiveBad':log('대가','노출 차이의 원인은 미확정이다. 원본은 보존했다.');visit('photoShop');break;
 case 'photoShopGood':clue('photoTrailClue','가게 영업 일지와 촬영 시각');visit('photoDecision');break;
 case 'photoShopBad':log('대가','영업 일지 열람은 거절됐다. 구두 증언의 한계를 기록했다.');visit('photoDecision');break;
 case 'taxiDispatchGood':clue('taxiTrailClue','자신의 호출 취소 이력과 블랙박스');visit('taxiRoad');break;
 case 'taxiDispatchBad':log('대가','호출 취소 사유는 확인할 수 없다. 시간 정보만 남았다.');visit('taxiRoad');break;
 case 'taxiRoadGood':clue('taxiTrailClue','공개 도로 안내와 자신의 블랙박스');visit('taxiDecision');break;
 case 'taxiRoadBad':log('대가','영상 속 사람은 식별되지 않는다. 시간과 위치만 정리했다.');visit('taxiDecision');break;
 case 'pressSourceGood':clue('pressTrailClue','공개 점검 공고와 제보 시각');visit('pressConflict');break;
 case 'pressSourceBad':log('대가','메일 작성자는 여전히 익명이다. 공개 공고만 확인했다.');visit('pressConflict');break;
 case 'pressConflictGood':clue('pressTrailClue','서로 다른 주민의 위치와 시각 대조');visit('pressDecision');break;
 case 'pressConflictBad':log('대가','증언의 충돌을 해소하지 못했다. 기사에는 상반된 주장으로 남긴다.');visit('pressDecision');break;
 case 'photoTrace':clue('photoTrailClue','연속 촬영 사진과 상점 주인 진술');visit('photoArchive');break;
 case 'photoTraceFail':log('대가','연속 사진이 흔들려 시간 정보만 확보했다. 상점 주인에게 재확인했다.');visit('photoArchive');break;
 case 'taxiTrace':clue('taxiTrailClue','본인 차량 블랙박스와 운행 기록');visit('taxiDispatch');break;
 case 'taxiTraceFail':log('대가','블랙박스 음성이 손상됐지만 운행 시각과 조명 변화는 확인했다.');visit('taxiDispatch');break;
 case 'pressTrace':clue('pressTrailClue','공개 전력 점검 공고와 주민 교차 취재');visit('pressSource');break;
 case 'pressTraceFail':log('대가','증언이 엇갈려 정전 원인은 확인하지 못했다. 기사에는 미확인으로 명시한다.');visit('pressSource');break;
 case 'civilianCrossGood':s.flags.crossVerified=true;log('교차 검증','서로 다른 원본의 신호 간격을 확인했다. 발신자는 여전히 불명이다.');visit('civilianCross');break;
 case 'civilianCrossBad':log('판정 결과','원본의 일부 시각이 불명확하다. 불확실성을 기록했다.');visit('civilianCross');break;
 case 'civilianPatternGood':s.flags.crossVerified=true;log('검증','안내판 사진의 시각과 공개 게시글의 순서를 확인했다.');visit('civilianPattern');break;
 case 'civilianPatternBad':log('판정 결과','안내판 사진의 메타데이터가 없어 시각은 확인하지 못했다.');visit('civilianPattern');break;
 case 'truthMapGood':s.flags.mapVerified=true;clue('mapEvidence','외부에서 확인한 방향·시간 대조');visit('truthArchive');break;
 case 'truthMapBad':log('실패의 대가','반사와 방향이 모호해 위치를 특정하지 못했다. 대신 공개 기록을 확인한다.');visit('truthArchive');break;
 case 'truthSenderGood':s.flags.senderVerified=true;clue('senderEvidence','공개 게시글의 시각 대조');visit('truthArchive');break;
 case 'truthSenderBad':log('실패의 대가','발신자는 확인되지 않았다. 위협 메시지는 원본 그대로 보존했다.');visit('truthArchive');break;
 case 'truthArchiveGood':s.flags.archiveVerified=true;clue('archiveEvidence','공개 설비 점검 공고의 수정 이력');visit('truthWitness');break;
 case 'truthArchiveBad':log('실패의 대가','수정 이력은 일부 누락됐다. 게시판 작성자의 증언을 별도로 검증한다.');visit('truthWitness');break;
 case 'truthWitnessGood':s.flags.witnessVerified=true;clue('witnessEvidence','공개 장소에서 확인한 직접 목격 진술');visit('truthTheory');break;
 case 'truthWitnessBad':log('실패의 대가','증언의 시간은 부정확하다. 직접 목격한 안내판의 위치만 기록한다.');visit('truthTheory');break;
 case 'truthTheoryGood':s.flags.theoryVerified=true;clue('mechanismEvidence','신호 주기와 점검 장치의 시험음 대조');visit('truthRevelation');break;
 case 'truthTheoryBad':log('실패의 대가','시험음의 정체는 단정할 수 없다. 서로 다른 출처의 반복 간격만 입증됐다.');visit('truthRevelation');break;
 case 'truthConfrontGood':s.flags.confrontVerified=true;s.flags.truthCore=!!(s.flags.theoryVerified&&(s.flags.archiveVerified||s.flags.mapVerified||s.flags.witnessVerified));clue('admissionEvidence','시설 관계자의 공개 답변 및 점검 시간 확인');visit('truthChoice');break;
 case 'truthConfrontBad':s.flags.truthCore=!!(s.flags.theoryVerified&&s.flags.archiveVerified&&s.flags.witnessVerified);log('취재','관계자는 설명을 거절했다. 입증되지 않은 책임은 단정하지 않는다.');visit('truthChoice');break;
 case 'callTruth':s.flags.callTruth=true;sanLoss(2,'수화기에서 들린 자신의 목소리');if(!s.ended)visit('civilianResolve');break;
 case 'callCost':sanLoss(4,'이해할 수 없는 반복 음성');if(!s.ended)visit('civilianResolve');break;

 case 'campaignArchiveGood':clue('archiveMaster','공개 공고 변경 이력과 서명된 접수 내역');clue('relayLedger','공개 접수번호 체계 대조');visit('archiveAnswer');break;
 case 'campaignArchiveBad':log('판정 결과','접수번호가 불명확하다. 담당자에게 사실확인 요청을 남겼다.');visit('archiveAnswer');break;
 case 'campaignRouteGood':clue('routeOverlap','외부 공개 자료와 직업별 원본 대조');visit('routeAnswer');break;
 case 'campaignRouteBad':log('판정 결과','동선은 하나로 연결되지 않는다. 위험 위치만 관계 기관에 알릴 수 있다.');visit('routeAnswer');break;
 case 'campaignVoiceGood':clue('voiceLoop','원본 음성의 파형·반복 주기 검증');visit('voiceAnswer');break;
 case 'campaignVoiceBad':log('판정 결과','음성의 조작 여부는 알 수 없다. 원본을 보존했다.');visit('voiceAnswer');break;
 case 'campaignWorkerGood':clue('witnessShift','근무자 본인 진술과 공개 교대표 대조');clue('humanLink','위조 의심 서명과 허위 접수번호의 관계');visit('workerConflict');break;
 case 'campaignWorkerBad':log('판정 결과','서명의 진위는 확인하지 못했다. 직접 들은 말만 기록했다.');visit('workerConflict');break;
 case 'campaignChainGood':clue('proofChain','원본 해시와 독립된 출처의 증거 목록');visit('chainChallenge');break;
 case 'campaignChainBad':log('판정 결과','일부 단서의 출처가 겹친다. 단독 증거로 사용하지 않기로 했다.');visit('chainChallenge');break;
 case 'officialTruthGood':s.flags.officialTruth=true;clue('mechanismEvidence','설비 담당자 입회하의 시험 기록');visit('final');break;
 case 'officialTruthBad':s.flags.officialPartial=true;log('조사','기계적 원인은 의심되지만 시험 기록 일부가 훼손됐다.');visit('final');break;
 case 'escape':visit('final');break;
 case 'escapeFail':damage(2,'넘어진 잔해');if(!s.ended)visit('final');break;
 default:visit('hub');
 }
}
function failAccept(){const r=s.roll;if(!r)return;s.roll=null;log('판정 결과','실패의 대가를 받아들였다.');result(r.failure);save();render()}
function push(){const r=s.roll;if(!r||!r.pushAvailable)return;r.push=true;r.pushAvailable=false;r.penalty=Math.max(r.penalty,1);s.tab='story';log('강행','시간과 위험을 감수해 같은 행동을 다시 시도한다. 실패하면 추가 대가가 따른다.');save();render()}
function failPushed(){const r=s.roll;if(!r)return;s.roll=null;damage(2,'강행 판정 실패');if(!s.ended){sanLoss(2,'실패의 충격');if(!s.ended)result(r.failure)}save();render()}
function spendLuck(){const r=s.roll;if(!r)return;const gap=r.value-r.target;if(gap<=0||gap>s.luck||r.value>=96||r.push)return; s.luck-=gap;log('행운',`행운 ${gap} 소모하여 ${r.skill} 판정을 성공으로 변경`);s.roll=null;result(r.success);save();render()}

function opposed(skillA,opponentSkill,mode='보통'){
 const a=rollValue(),b=rollValue();
 const rank=(v,k)=>v===1?4:v<=Math.floor(k/5)?3:v<=Math.floor(k/2)?2:v<=k?1:0;
 const ra=rank(a,skillA),rb=rank(b,opponentSkill);
 const win=ra>rb||(ra===rb&&skillA>=opponentSkill);
 log('대항 판정',`조사자 ${a}/${skillA} (등급 ${ra}) · 상대 ${b}/${opponentSkill} (등급 ${rb}) → ${win?'승리':'패배'}`);
 return win;
}
function luckRoll(){const v=rollValue();const win=v<=s.luck;log('행운 판정',`${v}/${s.luck} · ${win?'성공':'실패'}`);save();render();return win}
function recover(){
 if(s.ended)return;
 const v=rollValue(),good=v<=skill('응급처치');
 if(good){const heal=s.majorWound?1:Math.min(2,s.maxhp-s.hp);s.hp=Math.min(s.maxhp,s.hp+heal);if(s.dying){s.dying=false;s.stabilized=true;s.hp=Math.max(1,s.hp);s.scene='room'}log('응급처치',`성공 ${v} · HP ${heal} 회복`)}
 else{log('응급처치',`실패 ${v} · 회복하지 못했다`);if(s.dying)ending('unconscious')}
 save();render();
}
function psychoanalysis(){
 if(s.ended)return;
 const v=rollValue(),good=v<=skill('정신분석');
 if(good){s.san=Math.min(s.maxsan,s.san+Math.floor(Math.random()*3)+1);s.indefinite=false;s.insanity=false;s.temporary=0;log('정신분석',`성공 ${v} · 이성 회복 및 증상 안정`)}
 else log('정신분석',`실패 ${v} · 충분한 안정에 이르지 못했다`);
 save();render();
}
function advance(){
 if(!s.ended||s.growthReport)return;
 const marked=Object.keys(s.advancement||{}).filter(k=>s.advancement[k]);
 const report=[];
 for(const k of marked){const old=skill(k),v=rollValue();if(v>old){const gain=Math.floor(Math.random()*10)+1;s.skills[k]=Math.min(99,old+gain);report.push(`${k}: ${v}/${old} · 성장 성공 · ${old}% → ${skill(k)}%`);log('성장',report[report.length-1])}else{report.push(`${k}: ${v}/${old} · 성장 실패 · ${old}% 유지`);log('성장',report[report.length-1])}}
 if(!report.length)report.push('이번 이야기에서 성공해 성장 표시된 기술이 없습니다. 성장할 기술이 없어도 버튼은 정상적으로 작동했습니다.');
 s.advancement={};s.experience++;const luckGain=Math.floor(Math.random()*6);s.luck=Math.min(99,s.luck+luckGain);
 report.push(`행운 +${luckGain} · 현재 ${s.luck}`);s.growthReport=report;save();render();
}
function combatStart(){s.flags.combatDone=true;
 s.combat={enemyHP:8,enemyMaxHP:8,enemySkill:40,enemyDodge:30,round:1,position:'근접',escaped:false};
 s.scene='combat';log('전투','설비실의 그림자가 움직인다. 위협적인 존재가 출입구를 가로막는다.');save();render();
}
function combatAction(type){
 const c=s.combat;if(!c||s.ended)return;
 if(type==='flee'){if(opposed(skill('회피'),c.enemySkill)){c.escaped=true;s.combat=null;log('전투','회피에 성공해 안전한 통로로 빠져나왔다.');visit('final');return}log('전투','탈출 경로를 확보하지 못했다.')}
 else if(type==='fight'){
  const atk=rollValue(),def=rollValue(),ar=atk<=skill('근접전투')?atk<=Math.floor(skill('근접전투')/2)?2:1:0,dr=def<=c.enemyDodge?def<=Math.floor(c.enemyDodge/2)?2:1:0;
  if(ar>dr||(ar===dr&&skill('근접전투')>c.enemyDodge&&ar>0)){const d=Math.floor(Math.random()*4)+1;c.enemyHP-=d;log('전투',`공격 성공 ${atk} vs ${def}, 그림자에게 ${d} 피해`)}else log('전투',`공격 실패 ${atk} vs ${def}`);
 }else if(type==='dodge'){if(opposed(skill('회피'),c.enemySkill)){log('전투','공격을 피하고 구조대가 접근할 시간을 벌었다.');s.combat=null;visit('final');return}}
 if(c.enemyHP<=0){log('전투','그림자가 어둠 속으로 흩어졌다.');s.combat=null;visit('final');return}
 const ev=rollValue();if(ev<=c.enemySkill){damage(Math.floor(Math.random()*3)+1,'그림자의 공격');if(s.ended||s.dying)return}else log('전투','그림자의 공격이 빗나갔다.');
 c.round++;save();render();
}
function chaseStart(){s.flags.chaseDone=true;s.chase={distance:3,round:1,maxRound:6};s.scene='chase';log('추격','설비실의 금속문이 닫히기 시작한다. 출구까지 3구간이다.');save();render()}
function chaseAction(type){
 const c=s.chase;if(!c)return;
 const k=type==='sprint'?'DEX':type==='climb'?'등반':'길찾기';
 const target=type==='sprint'?stat('DEX'):skill(k),v=rollValue(),ok=v<=target;
 if(ok){c.distance--;log('추격',`${k} 성공 ${v}/${target}. 출구에 가까워졌다.`)}
 else{log('추격',`${k} 실패 ${v}/${target}. 시간을 허비했다.`);if(type==='sprint')damage(1,'미끄러짐');else if(type==='climb')sanLoss(1,'낙하하는 구조물')}
 if(s.ended||s.dying)return;
 c.round++;
 if(c.distance<=0){s.chase=null;visit('final');return}
 if(c.round>c.maxRound){s.chase=null;damage(2,'폐쇄되는 통로');if(!s.ended&&!s.dying)visit('final');return}
 save();render();
}
function opt(label,go,ok=true){return {label,go,ok}}
function options(){
 const have=id=>s.facts.includes(id),flag=id=>!!s.flags[id];
 const once=(id,action)=>!flag(id)?action:()=>{};
 const O=[];
 switch(s.scene){
 case 'intro':O.push(opt('주변 상황을 살핀다',()=>visit({형사:'police',사진가:'photo',택시기사:'taxi',기자:'press',소방관:'fire'}[s.job])));break;
 case 'police':
  O.push(opt('실종 신고 접수 내용과 마지막 연락 기록을 먼저 검토한다',()=>visit('policeReview')));
  O.push(opt('박지민의 신고 경위를 면담한다',()=>check('설득','보통','report','reportBlur')));
  O.push(opt('02:17 음성 제보를 청취한다',()=>check('듣기','보통','audio','audioBlur')));
  O.push(opt('사건 자료를 정리한다',()=>visit('hub')));break;
 case 'policeBrief':
  O.push(opt('신고자 박지민을 직접 면담한다',()=>check('심리학','보통','report','reportBlur')));
  O.push(opt('관련 여부가 불명확한 음성 파일을 검토한다',()=>check('듣기','보통','audio','audioBlur')));
  O.push(opt('현 단계에서 확보된 사실만 정리한다',()=>visit('hub')));break;
 case 'photo':
  O.push(opt('촬영본을 정리하고 일상으로 돌아간다',()=>visit('photoNotice')));
  O.push(opt('골목 사진을 후보정해 보관한다',()=>{s.flags.photoEdited=true;log('사진 작업','촬영본의 노출을 보정하고 원본을 별도 보관했다.');visit('photoNotice')}));break;
 case 'photoNotice':
  O.push(opt('게시글의 시간과 장소를 내 촬영 기록과 대조한다',()=>visit('photoCompare')));
  O.push(opt('아직 관련성이 불분명하므로 게시글만 저장한다',()=>{s.flags.noticeSaved=true;visit('photoCompare')}));break;
 case 'photoCompare':
  O.push(opt('사진 원본의 촬영 시각과 배경을 정밀 확인한다',()=>check('사진술','보통','image','photoBlur')));
  O.push(opt('지금은 사진을 제보하지 않고 기록만 남긴다',()=>{s.flags.photoDeferred=true;visit('hub')}));break;
 case 'taxi':
  O.push(opt('운행 앱의 최근 승하차 기록을 확인한다',()=>visit('taxiRecord')));
  O.push(opt('휴대전화의 외관과 발견 위치를 기록한다',()=>{clue('object','차량 뒷좌석에서 발견한 잠긴 휴대전화');visit('taxiRecord')}));break;
 case 'taxiRecord':
  if(!have('route'))O.push(opt('운행 시각과 하차 위치를 대조한다',()=>check('자동차운전','보통','route','taxiBlur')));
  if(!have('gesture'))O.push(opt('마지막 승객의 행동을 떠올린다',()=>check('관찰','어려움','gesture','taxiBlur')));
  O.push(opt('분실물 접수 절차를 확인한다',()=>visit('taxiNotice')));break;
 case 'taxiNotice':
  O.push(opt('휴대전화를 정식 분실물로 인계한다',()=>visit('taxiHandoff')));
  O.push(opt('운행 내역과 발견 사실을 먼저 기록한다',()=>{s.flags.taxiDocumented=true;visit('taxiHandoff')}));break;
 case 'taxiHandoff':
  if(!have('object'))O.push(opt('잠긴 휴대전화의 발견 상태를 인계서에 기록한다',()=>{clue('object','분실물 인계서');visit('taxiHandoff')}));
  O.push(opt('분실물 인계를 마치고 귀가한다',()=>{if(!have('object'))clue('object','분실물 인계서의 발견 기록');s.flags.submitted=true;s.flags.taxiHandoff=true;visit('verification')}));break;
 case 'press':
  O.push(opt('메일 헤더와 음성의 출처를 확인한다',()=>visit('pressScreen')));
  O.push(opt('제보 메일을 삭제하지 않고 별도로 보존한다',()=>{s.flags.mailPreserved=true;visit('pressScreen')}));break;
 case 'pressScreen':
  O.push(opt('원본 음성 파일을 분석한다',()=>check('자료조사','보통','mail','mailBlur')));
  O.push(opt('확인되지 않은 내용은 보도하지 않고 추가 제보를 기다린다',()=>visit('pressLead')));break;
 case 'pressLead':
  if(!have('mail'))O.push(opt('실종 게시물과 제보 음성의 시각을 대조한다',()=>check('자료조사','보통','mail','mailBlur')));
  O.push(opt('담당 경찰에 제보의 진위 확인을 요청한다',()=>{s.flags.submitted=true;visit('verification')},have('mail')));
  O.push(opt('기사화를 보류하고 공개 자료를 더 검증한다',()=>{s.flags.heldPublication=true;visit('pressTrail')}));break;
 case 'fire':
  O.push(opt('상황실에서 전달한 신고 음성을 재청취한다',()=>check('듣기','보통','emergency','emergencyBlur')));
  O.push(opt('현장 주소가 확인될 때까지 구조 장비를 점검한다',()=>visit('fireSafety')));break;
 case 'fireDispatch':
  if(!have('emergency'))O.push(opt('신고 녹음과 접수 시각을 확인한다',()=>check('듣기','보통','emergency','emergencyBlur')));
  O.push(opt('상황실의 추가 위치 확인 결과를 기다린다',()=>visit('fireLink')));break;
 case 'fireLink':
  O.push(opt('지휘자 지시에 따라 경찰과 공조 자료를 교환한다',()=>{s.flags.submitted=true;visit('verification')}));
  O.push(opt('출동 주소 확인 전까지 장비를 점검하고 상황실에 재확인을 요청한다',()=>{s.flags.firePrepared=true;visit('verification')}));break;
 case 'photoTrail':
  O.push(opt('연속 촬영 사진에서 보행 방향을 복원한다',()=>check('사진술','어려움','photoTrace','photoTraceFail')));
  O.push(opt('촬영 위치에 다시 가서 간판과 보행 동선을 확인한다',()=>visit('photoWitness')));break;
 case 'photoWitness':
  O.push(opt('주인이 직접 본 보행 방향과 사진의 위치를 비교한다',()=>check('설득','보통','photoTrace','photoTraceFail')));
  O.push(opt('확인 가능한 사진부터 다시 검토한다',()=>visit('photoTrail')));break;
 case 'photoSignal':
  O.push(opt('원본 사진과 시간표를 경찰에 제출하고 독자적으로 기록을 보존한다',()=>{s.flags.submitted=true;visit('civilianChoice')}));
  O.push(opt('경찰에 전달하기 전에 제3자에게 사진의 조작 여부를 검토받는다',()=>{s.flags.independentCheck=true;visit('civilianChoice')}));break;
 case 'taxiTrail':
  O.push(opt('본인 차량 블랙박스와 운행 기록을 교차 검증한다',()=>check('관찰','보통','taxiTrace','taxiTraceFail')));
  O.push(opt('평소 들르는 편의점에서 당시 도로 상황을 묻는다',()=>visit('taxiWitness')));break;
 case 'taxiWitness':
  O.push(opt('편의점 주인의 기억과 하차 시각을 대조한다',()=>check('설득','보통','taxiTrace','taxiTraceFail')));
  O.push(opt('우선 본인 운행 기록을 다시 확인한다',()=>visit('taxiTrail')));break;
 case 'taxiSignal':
  O.push(opt('원본 영상의 필요한 부분만 경찰에 제출한다',()=>{s.flags.submitted=true;visit('civilianChoice')}));
  O.push(opt('개인정보가 드러나지 않도록 시간 정보만 먼저 정리한다',()=>{s.flags.privacyProtected=true;visit('civilianChoice')}));break;
 case 'pressTrail':
  O.push(opt('공개된 전력 점검 공고와 녹음 시간을 대조한다',()=>check('자료조사','어려움','pressTrace','pressTraceFail')));
  O.push(opt('입주민 대표에게 직접 확인된 사실만 묻는다',()=>visit('pressWitness')));break;
 case 'pressWitness':
  O.push(opt('서로 다른 주민의 진술을 교차 확인한다',()=>check('심리학','보통','pressTrace','pressTraceFail')));
  O.push(opt('공개 기록을 다시 조사한다',()=>visit('pressTrail')));break;
 case 'pressSignal':
  O.push(opt('검증된 사실만 기사로 쓰고 음성의 출처는 미확인이라고 명시한다',()=>{s.flags.published=true;visit('civilianChoice')}));
  O.push(opt('취재원 보호를 위해 보도를 미루고 자료를 경찰에 추가 제출한다',()=>{s.flags.heldPublication=true;s.flags.submitted=true;visit('civilianChoice')}));break;
 case 'civilianChoice':
  O.push(opt('발신자 없는 전화를 받고 통화 내용을 녹음한다',()=>{s.flags.answered=true;sanLoss(1,'자신의 목소리와 닮은 통화');if(!s.ended)visit('civilianCall')}));
  O.push(opt('전화를 받지 않고 발신 기록과 시간을 보존한다',()=>{s.flags.answered=false;visit('civilianResolve')}));break;
 case 'civilianCall':
  O.push(opt('통화를 종료하고 원본을 보존한다',()=>{s.flags.recordingSaved=true;visit('civilianResolve')}));
  O.push(opt('세 번째 소리의 정체를 끝까지 듣는다',()=>check('듣기','어려움','callTruth','callCost')));break;
 case 'civilianResolve':
  O.push(opt('원본을 보존하고 신호의 반복 간격을 추가 검증한다',()=>visit('civilianFollow')));
  O.push(opt('위협 가능성을 기록하고 공개 자료만 확인한다',()=>{s.flags.cautious=true;visit('civilianFollow')}));break;
 case 'civilianFollow':
  O.push(opt('자신이 보유한 원본의 시간 정보를 교차 확인한다',()=>check(s.job==='사진가'?'사진술':s.job==='택시기사'?'관찰':'자료조사','보통','civilianCrossGood','civilianCrossBad')));
  O.push(opt('공개된 게시글의 작성 시각부터 확인한다',()=>{s.flags.publicChecked=true;visit('civilianCross')}));break;
 case 'civilianCross':
  O.push(opt('게시글 작성자에게 구체적으로 직접 본 사실만 묻는다',()=>visit('civilianContact')));
  O.push(opt('원본과 게시글을 분리해 보관하고 다음 단서를 검토한다',()=>{s.flags.preserved=true;visit('civilianContact')}));break;
 case 'civilianContact':
  O.push(opt('공개된 카페에서 만나 증언의 출처를 확인한다',()=>visit('civilianMeeting')));
  O.push(opt('대면하지 않고 안내판 사진과 작성 시각만 요청한다',()=>{s.flags.remote=true;visit('civilianPattern')}));break;
 case 'civilianMeeting':
  O.push(opt('안내판 사진의 촬영 시각과 게시글을 비교한다',()=>check('관찰','보통','civilianPatternGood','civilianPatternBad')));
  O.push(opt('안전을 위해 만남을 끝내고 자료를 보존한다',()=>{s.flags.cautious=true;visit('civilianPattern')}));break;
 case 'civilianPattern':
  O.push(opt('삭제 요구 메시지와 원본을 별도 저장하고 경찰에 알린다',()=>{s.flags.threatReported=true;visit('civilianFinal')}));
  O.push(opt('메시지에 응답하지 않고 기록의 진위만 재검증한다',()=>{s.flags.cautious=true;visit('civilianFinal')}));break;
 case 'civilianFinal':
  O.push(opt('수집한 시간표로 신호가 발생한 장소를 추정한다',()=>visit('truthMap')));
  O.push(opt('위험을 줄이기 위해 익명 메시지부터 검증한다',()=>{s.flags.cautious=true;visit('truthSender')}));break;
 case 'truthMap':
  O.push(opt(s.job==='사진가'?'사진의 반사면과 건물 외벽을 대조한다':s.job==='택시기사'?'블랙박스의 방향과 도로 지도를 대조한다':'공개 건축물 현황도와 증언을 대조한다',()=>check(s.job==='사진가'?'사진술':s.job==='택시기사'?'길찾기':'자료조사','어려움','truthMapGood','truthMapBad')));
  O.push(opt('추정 장소를 확정하지 않고 공개 시설 공고부터 찾는다',()=>visit('truthArchive')));break;
 case 'truthSender':
  O.push(opt('발신 시각과 공개된 민원 게시글을 대조한다',()=>check('자료조사','보통','truthSenderGood','truthSenderBad')));
  O.push(opt('익명 연락에 응답하지 않고 공공 기록을 먼저 확인한다',()=>visit('truthArchive')));break;
 case 'truthArchive':
  O.push(opt('공개 점검 공고의 변경 이력과 시간을 대조한다',()=>check('자료조사','보통','truthArchiveGood','truthArchiveBad')));
  O.push(opt('공개 민원 기록과 게시판 증언을 교차 확인한다',()=>{s.flags.archivePartial=true;visit('truthWitness')}));break;
 case 'truthWitness':
  O.push(opt('게시글 작성자에게 실제로 본 것과 들은 것을 구분해 묻는다',()=>check('설득','보통','truthWitnessGood','truthWitnessBad')));
  O.push(opt('현장에 들어가지 않고 바깥 안내판과 공개 자료를 대조한다',()=>{s.flags.safeInquiry=true;visit('truthTheory')}));break;
 case 'truthTheory':
  O.push(opt('세 번의 소리가 사람의 신호가 아닌 설비의 시험음인지 검증한다',()=>check(s.job==='사진가'?'관찰':s.job==='택시기사'?'듣기':'자료조사','어려움','truthTheoryGood','truthTheoryBad')));
  O.push(opt('다른 설명도 남겨 두고 세 자료의 시간표를 작성한다',()=>{s.flags.theoryPartial=true;visit('truthRevelation')}));break;
 case 'truthRevelation':
  O.push(opt('확인된 근거와 미확인 추정을 구분해 경찰·관리주체에 전달한다',()=>{s.flags.relayed=true;visit('truthConfront')}));
  O.push(opt('자료를 두 곳에 안전하게 보관하고 독립 검증을 계속한다',()=>{s.flags.secureCopies=true;visit('truthConfront')}));break;
 case 'truthConfront':
  O.push(opt('공개된 장소에서 시설 관계자에게 점검 기록의 모순을 질의한다',()=>check('설득','보통','truthConfrontGood','truthConfrontBad')));
  O.push(opt('접촉을 피하고 담당 기관에 자료 검증을 공식 요청한다',()=>{s.flags.safeInquiry=true;visit('truthChoice')}));break;
 case 'truthChoice':
  O.push(opt('확인된 사실을 정리하고 기록 공백의 원인을 계속 조사한다',()=>{s.flags.truthPath='public';visit('chapter2')}));
  O.push(opt('피해자 보호를 우선하며 기록 공백을 계속 조사한다',()=>{s.flags.truthPath='private';visit('chapter2')}));
  if(s.flags.answered||s.flags.callTruth)O.push(opt('녹음된 내 목소리의 원인을 추적한다',()=>{s.flags.truthPath='voice';sanLoss(2,'되돌아온 자신의 목소리');if(!s.ended)visit('voiceDesk')}));break;
 case 'photoArchive':
  O.push(opt('촬영 순서와 EXIF 시간을 다시 검증한다',()=>check('사진술','어려움','photoArchiveGood','photoArchiveBad')));
  O.push(opt('촬영지 가게에 직접 확인하러 간다',()=>visit('photoShop')));break;
 case 'photoShop':
  O.push(opt('영업 일지의 날짜와 시간만 확인해 달라고 요청한다',()=>check('설득','보통','photoShopGood','photoShopBad')));
  O.push(opt('영업 일지 열람 없이 확인 가능한 사실만 정리한다',()=>visit('photoDecision')));break;
 case 'photoDecision':
  O.push(opt('확인한 위치와 촬영 원본을 정식 제보한다',()=>{s.flags.submitted=true;s.flags.photoVerified=true;visit('civilianChoice')}));
  O.push(opt('공개된 건물 배치도와 비교하고 추정임을 명시한다',()=>{s.flags.photoMapped=true;visit('civilianChoice')}));break;
 case 'taxiDispatch':
  O.push(opt('본인 호출 이력과 블랙박스 시각을 대조한다',()=>check('자동차운전','어려움','taxiDispatchGood','taxiDispatchBad')));
  O.push(opt('도로 공사 안내를 확인한다',()=>visit('taxiRoad')));break;
 case 'taxiRoad':
  O.push(opt('우회도로의 영상과 운행 기록을 교차 확인한다',()=>check('관찰','보통','taxiRoadGood','taxiRoadBad')));
  O.push(opt('확인되지 않은 호출 사유를 제외하고 시간표를 정리한다',()=>visit('taxiDecision')));break;
 case 'taxiDecision':
  O.push(opt('원본 영상과 시간표를 경찰에 제출한다',()=>{s.flags.submitted=true;s.flags.taxiVerified=true;visit('civilianChoice')}));
  O.push(opt('개인정보를 보호하며 공개 장소의 목격자에게 확인한다',()=>{s.flags.taxiWitnessed=true;visit('civilianChoice')}));break;
 case 'pressSource':
  O.push(opt('제보자의 주장과 공개 공고를 비교한다',()=>check('자료조사','어려움','pressSourceGood','pressSourceBad')));
  O.push(opt('반대 증언을 확인하기 위해 주민에게 묻는다',()=>visit('pressConflict')));break;
 case 'pressConflict':
  O.push(opt('상충하는 진술의 장소와 시각을 교차 확인한다',()=>check('심리학','보통','pressConflictGood','pressConflictBad')));
  O.push(opt('증언이 엇갈린다는 사실을 그대로 기록한다',()=>visit('pressDecision')));break;
 case 'pressDecision':
  O.push(opt('관리사무소에 반론을 요청하고 확인된 사실만 보도한다',()=>{s.flags.published=true;s.flags.rightOfReply=true;visit('civilianChoice')}));
  O.push(opt('제보자 보호를 우선하고 보도를 보류한다',()=>{s.flags.heldPublication=true;visit('civilianChoice')}));break;
 case 'policeReview':
  O.push(opt('박지민의 직접 경험과 전언을 구분해 면담한다',()=>visit('policeInterview')));
  O.push(opt('통신 구역의 의미와 한계를 확인한다',()=>check('자료조사','보통','tower','towerBlur')));break;
 case 'policeInterview':
  O.push(opt('신고자의 진술을 기록하고 관련성을 검증한다',()=>check('심리학','보통','report','reportBlur')));
  O.push(opt('공식 자료 확인을 위해 수사팀으로 돌아간다',()=>visit('hub')));break;
 case 'fireSafety':
  O.push(opt('구조 장비와 진입 절차를 점검한다',()=>{s.flags.fireReady=true;visit('fireLink')}));
  O.push(opt('상황실에 위치 확인을 다시 요청한다',()=>visit('fireLink')));break;
 case 'fireAssessment':
  O.push(opt('설비 담당자와 산소 농도 및 진입 안전을 확인한다',()=>{s.flags.fireReady=true;visit('basement')}));
  O.push(opt('동료의 추가 장비가 도착할 때까지 기다린다',()=>{s.flags.fireBackup=true;visit('basement')}));break;
 case 'hub':
  if(['사진가','택시기사','기자'].includes(s.job)){
   if(s.job==='사진가'&&!have('image'))O.push(opt('실종 게시글과 사진 원본을 대조한다',()=>check('사진술','보통','image','photoBlur')));
   if(s.job==='택시기사'&&!have('route'))O.push(opt('본인 운행 기록을 확인한다',()=>check('자동차운전','보통','route','taxiBlur')));
   if(s.job==='기자'&&!have('mail'))O.push(opt('익명 제보 원본을 확인한다',()=>check('자료조사','보통','mail','mailBlur')));
   if(!flag('submitted')&&s.facts.length)O.push(opt('현재까지 확인한 사실을 경찰에 제보한다',()=>{s.flags.submitted=true;log('제보','확인한 사실과 원본만 제출했다. 경찰 수사 자료는 받지 않았다.');visit('verification')}));
   O.push(opt(s.job==='사진가'?'연속 촬영 사진의 다른 단서를 추적한다':s.job==='택시기사'?'자신의 운행 기록에서 추가 단서를 찾는다':'경찰 제보와 별개로 독립 취재를 이어간다',()=>visit({사진가:'photoTrail',택시기사:'taxiTrail',기자:'pressTrail'}[s.job])));
   O.push(opt('현재까지의 단서를 수사 노트에서 정리한다',()=>{s.tab='clues';render()}));
   break;
  }
  if(!have('report'))O.push(opt(s.job==='형사'?'실종 신고자 박지민을 면담한다':'상황실에서 공유한 신고 요지를 확인한다',()=>check(s.job==='형사'?'설득':'심리학','보통','report','reportBlur')));
  if(!have('audio')&&!have('emergency'))O.push(opt('담당자가 공개 가능한 범위의 신고 음성 요지를 듣는다',()=>check('듣기','보통','audio','audioBlur')));
  if(!have('tower'))O.push(opt('김도현에게 통신 구역 확인 여부를 문의한다',()=>check('자료조사','보통','tower','towerBlur')));
  if(s.job==='택시기사'&&!have('route'))O.push(opt('운행 기록을 다시 확인한다',()=>check('자동차운전','보통','route','taxiBlur')));
  if(s.job==='택시기사'&&!have('gesture'))O.push(opt('하차 순간의 모습을 되짚는다',()=>check('관찰','어려움','gesture','taxiBlur')));
  if(s.job==='사진가'&&!have('image'))O.push(opt('게시글과 사진의 배경을 비교한다',()=>check('사진술','보통','image','photoBlur')));
  if(s.job==='기자'&&!have('mail'))O.push(opt('익명 메일을 확인한다',()=>check('자료조사','보통','mail','mailBlur')));
  if(s.job==='소방관'&&!have('emergency'))O.push(opt('119 신고 녹음을 확인한다',()=>check('듣기','보통','emergency','emergencyBlur')));
  if(!flag('submitted')&&s.job!=='형사')O.push(opt('확인한 자료만 경찰에 정식 제보한다',()=>{s.flags.submitted=true;log('제보','경찰에 직접 확인한 자료와 출처만 전달했다.');visit('hub')},s.facts.length>0));
  if(!have('address')&&have('report')&&have('tower')&&(s.job==='형사'||flag('submitted')))O.push(opt(s.job==='형사'?'관리인과 통화해 방문 예약 기록을 확인한다':'경찰의 주소 확인 결과를 기다린다',()=>{clue('address','김도현이 통신 구역과 관리인 최은정의 예약 기록을 대조');log('현장 확인','예약 기록은 방문 예정 장소를 가리킬 뿐, 실종자의 실제 출입 여부는 확인되지 않았다.');visit('apartment')}));
  if(have('address')&&(s.job==='형사'||s.job==='소방관'))O.push(opt('공식 업무에 따라 청운아파트 현장으로 간다',()=>visit('apartment')));
  O.push(opt('지금까지의 정보를 다시 검토한다',()=>{s.tab='clues';render()}));
  break;
 case 'verification':
  if(s.job==='택시기사')O.push(opt('경찰이 분실물 소유자를 확인한 뒤 연락을 받는다',()=>{s.flags.verified=true;log('확인','분실물 접수 절차를 거쳐 소유자가 이서윤으로 확인됐다. 탑승자와 소유자가 같은 사람인지는 아직 확인되지 않았다. 김도현은 필요한 범위에서 하차 시각만 재확인했다.');visit('taxiTrail')}));
  else if(s.job==='사진가')O.push(opt('신고자에게 사진을 제시한 확인 결과를 듣는다',()=>{s.flags.verified=true;log('확인','박지민이 사진 속 외투와 가방이 이서윤의 것과 비슷하다고 했지만 얼굴은 식별하지 못했다. 경찰은 촬영 시각과 위치만 동선 단서로 활용한다.');visit('photoTrail')}));
  else if(s.job==='기자')O.push(opt('경찰의 접수 확인과 공개 가능한 설명을 듣는다',()=>{s.flags.verified=true;log('확인','경찰은 자료를 접수했으나 음성의 출처와 실종 사건의 연관성을 확인 중이라고 밝혔다. 수사 중인 자료의 내용은 공개하지 않았다.');visit('pressTrail')}));
  else O.push(opt('상황실의 공조 접수 및 출동 지시를 확인한다',()=>{s.flags.verified=true;s.flags.dispatchAuthorized=true;log('출동 지시','상황실과 경찰이 별도 확인한 방문 예정 장소에 대해 현장 안전 확인 요청이 접수됐다. 현장 주소는 지휘자를 통해 구조대에 전달됐다.');clue('address','상황실의 공식 출동 지시 및 경찰 현장 확인 요청');visit('apartment')}));
  break;
 case 'apartment':
  if(s.job==='소방관'&&!s.flags.fireAssessmentDone)O.push(opt('구조대 진입 위험을 먼저 평가한다',()=>{s.flags.fireAssessmentDone=true;visit('fireAssessment')}));
  if(!have('witness'))O.push(opt(s.job==='형사'||s.job==='소방관'?'경비원 오성호를 면담한다':'경비원에게 직접 본 내용을 묻는다',()=>check('심리학','보통','witness','witnessBlur')));
  if(!have('video')&&(s.job==='형사'||s.job==='소방관'))O.push(opt('관리인이 보존한 복도 영상을 확인한다',()=>check('관찰','보통','video','videoBlur')));
  if(have('witness')||have('video'))O.push(opt(s.job==='형사'||s.job==='소방관'?'김도현과 구조대의 입회 아래 7층으로 이동한다':'현장 출입 통제를 지키며 담당자에게 확인된 동선을 전달한다',()=>visit(s.job==='형사'||s.job==='소방관'?'floor':'civilian')));
  O.push(opt('다른 자료를 더 확인한다',()=>visit('hub')));break;
 case 'floor':
  O.push(opt('거주자 연락 및 긴급 구조 필요성을 확인하고 진입한다',()=>{s.flags.entry=true;log('현장','김도현이 긴급 위험과 진입 경위를 기록하고 구조 인력이 입회했다.');visit('room')}));
  O.push(opt('경비실로 돌아간다',()=>visit('apartment')));break;
 case 'room':
  if(!have('note'))O.push(opt('책상 위 노트와 출입표를 조사한다',()=>check('관찰','보통','note','noteBlur')));
  if(have('note'))O.push(opt('출입표의 B2 표시를 따라 지하로 내려간다',()=>visit('basement')));
  O.push(opt('7층 복도로 돌아간다',()=>visit('floor')));break;
 case 'basement':
  if(!have('signal'))O.push(opt('기계음과 녹음의 간격을 대조한다',()=>check('듣기','보통','signal','signalBlur')));
  if(!have('pattern')&&have('signal'))O.push(opt('설비 담당자와 제어판을 조사한다',()=>check('기계수리','어려움','pattern','patternBlur')));
  if(!have('victim'))O.push(opt('구조대와 함께 안쪽에서 사람을 찾는다',()=>check('관찰','보통','victim','victimBlur')));
  if(have('victim'))O.push(opt('구조 방식을 결정한다',()=>visit('victim')));
  O.push(opt('704호로 돌아간다',()=>visit('room')));break;
 case 'civilian':
  O.push(opt('확인한 제보를 정리하고 구조 결과를 기다린다',()=>visit('civilianEnd')));
  O.push(opt('경비실에서 추가 목격자를 찾아본다',()=>visit('apartment')));
  break;
 case 'civilianEnd':
  O.push(opt('제보자로서 후속 연락 내용을 확인한다',()=>ending('civilian')));
  break;
 case 'critical':O.push(opt('동료에게 응급처치를 요청한다',()=>recover()));O.push(opt('의식을 유지하려 노력한다',()=>{if(opposed(stat('CON'),60)){s.hp=1;s.dying=false;visit('room')}else ending('unconscious')}));break;
 case 'officialTruth':
  O.push(opt('설비 담당자와 시험 기록을 대조한다',()=>check(s.job==='소방관'?'기계수리':'자료조사','보통','officialTruthGood','officialTruthBad')));
  O.push(opt('구조를 우선하고 기록 보존을 요청한다',()=>{s.flags.officialPartial=true;visit('final')}));break;
 case 'victim':
  if(!s.flags.officialReviewed)O.push(opt('구조대가 확보한 설비 시험 기록을 확인한다',()=>{s.flags.officialReviewed=true;visit('officialTruth')}));
  O.push(opt('119 구조대와 함께 이서윤을 먼저 대피시킨다',()=>check('응급처치','보통','escape','escapeFail')));
  if(have('pattern'))O.push(opt('설비 담당자의 확인 아래 장치를 차단한다',()=>ending('safe')));
  O.push(opt('위험을 무시하고 전원을 직접 내린다',()=>{damage(2,'무리한 전원 차단');if(!s.ended)ending('risk')}));
  break;

 case 'chapter2':
  if(!s.flags.campArchive)O.push(opt('공개 점검 공고의 원본을 추적한다',()=>visit('archiveDesk')));
  if(!s.flags.campRoute)O.push(opt('사진·차량·신고 위치의 동선을 대조한다',()=>visit('routeDesk')));
  if(!s.flags.campVoice)O.push(opt('세 번의 신호가 담긴 음성의 앞뒤를 분석한다',()=>visit('voiceDesk')));
  if(s.flags.campArchive&&s.flags.campRoute&&s.flags.campVoice)O.push(opt('세 조사 결과를 비교해 다음 단계로 진행한다',()=>visit('chapter3')));
  break;
 case 'archiveDesk':
  O.push(opt('공개 공고와 접수번호 체계를 대조한다',()=>check(s.job==='형사'?'법률':'자료조사','어려움','campaignArchiveGood','campaignArchiveBad')));
  O.push(opt('담당자에게 공개 가능한 접수번호를 문의한다',()=>visit('archiveAnswer')));break;
 case 'archiveAnswer':
  O.push(opt('접수번호의 발급 경위를 확인하고 원본 보존을 요청한다',()=>{s.flags.archiveRequest=true;s.flags.campArchive=true;visit('chapter2')}));
  O.push(opt('확인되지 않은 점을 기록하고 다른 단서를 찾는다',()=>{s.flags.campArchive=true;visit('chapter2')}));break;
 case 'routeDesk':
  O.push(opt('직업별 전문성을 활용해 외부 동선을 검증한다',()=>check(s.job==='사진가'?'사진술':s.job==='택시기사'?'길찾기':s.job==='기자'?'자료조사':s.job==='소방관'?'길찾기':'추적','보통','campaignRouteGood','campaignRouteBad')));
  O.push(opt('외부 공공 안내도를 직접 확인한다',()=>visit('routeAnswer')));break;
 case 'routeAnswer':
  O.push(opt('비상 출입구의 위험을 관계 기관에 알린다',()=>{clue('safetyPlan','외부 안내도 및 신고 접수 기록');s.flags.campRoute=true;visit('chapter2')}));
  O.push(opt('동선의 한계를 기록하고 다음 자료를 확인한다',()=>{s.flags.campRoute=true;visit('chapter2')}));break;
 case 'voiceDesk':
  O.push(opt('원본 음성의 반복 구간을 비교한다',()=>check(s.job==='소방관'?'기계수리':s.job==='기자'?'자료조사':'듣기','어려움','campaignVoiceGood','campaignVoiceBad')));
  O.push(opt('음성의 진위를 단정하지 않고 다른 증거를 찾는다',()=>visit('voiceAnswer')));break;
 case 'voiceAnswer':
  O.push(opt('원본을 봉인하고 사람의 조작 흔적을 추적한다',()=>{s.flags.voicePreserved=true;s.flags.campVoice=true;visit('chapter2')}));
  O.push(opt('음성의 출처가 불확실함을 기록하고 다음 조사로 이동한다',()=>{s.flags.campVoice=true;visit('chapter2')}));break;
 case 'chapter3':
  if(!s.flags.campWorker)O.push(opt('시설 직원에게 직접 확인 가능한 사실만 묻는다',()=>visit('workerInterview')));
  if(s.flags.campWorker)O.push(opt('시설 기록을 검증한 뒤 외부 출입구의 안전 조치를 요청한다',()=>visit('safetyChoice')));break;
 case 'workerInterview':
  O.push(opt('교대표 서명과 공개 요청번호의 모순을 대조한다',()=>check(s.job==='형사'?'심리학':s.job==='기자'?'설득':'관찰','보통','campaignWorkerGood','campaignWorkerBad')));
  O.push(opt('진술을 단정하지 않고 기록 보존을 요청한다',()=>visit('workerConflict')));break;
 case 'workerConflict':
  O.push(opt('개인정보를 제외한 사실확인서를 요청한다',()=>{s.flags.privacySafe=true;s.flags.campWorker=true;visit('chapter3')}));
  O.push(opt('자료 보존 요청의 접수번호를 확보한다',()=>{s.flags.archiveRequest=true;s.flags.campWorker=true;visit('chapter3')}));break;
 case 'safetyChoice':
  O.push(opt(s.job==='형사'||s.job==='소방관'?'공식 공조에 따라 현장 안전 확보를 요청한다':'출입 통제선을 지키고 정확한 위험 위치를 신고한다',()=>visit(s.job==='형사'||s.job==='소방관'?'officialSafety':'civilSafety')));
  O.push(opt('증거 보존을 먼저 요청하고 안전 조치를 기다린다',()=>{s.flags.cautious=true;visit('chapter4')}));break;
 case 'officialSafety':
  O.push(opt('구조와 기록 보존의 담당자를 분리해 지시한다',()=>{s.flags.safetyCoordinated=true;clue('safetyPlan','공식 공조와 현장 안전 계획');visit('chapter4')}));break;
 case 'civilSafety':
  O.push(opt('현장 신고 접수번호와 외부 기록을 보존한다',()=>{s.flags.safetyCoordinated=true;clue('safetyPlan','정식 신고 접수 기록');visit('chapter4')}));break;
 case 'chapter4':
  O.push(opt('서로 독립된 증거를 구분해 증거 목록을 만든다',()=>visit('chainReview')));break;
 case 'chainReview':
  O.push(opt('원본 파일과 독립된 증언의 출처를 대조한다',()=>check(s.job==='사진가'?'사진술':s.job==='택시기사'?'관찰':'자료조사','어려움','campaignChainGood','campaignChainBad')));
  O.push(opt('미확인 증거를 제외하고 확인된 사실만 정리한다',()=>visit('chainChallenge')));break;
 case 'chainChallenge':
  O.push(opt('점검 기록 조작과 설명 불가능한 음성을 분리해 판단한다',()=>{s.flags.reasoned=true;visit('finalReveal')}));
  O.push(opt('시설 측 반론을 기록하고 추가 자료를 요청한다',()=>{s.flags.rightOfReply=true;visit('finalReveal')}));break;
 case 'finalReveal':
  O.push(opt('실종자의 안전과 기록 보존을 확인한 뒤 최종 보고한다',()=>visit('epilogue')));
  O.push(opt('음성의 마지막 17초를 다시 듣는다 (SAN 위험)',()=>{sanLoss(2,'17초의 시간 역전');if(!s.ended){s.flags.echoSeen=true;visit('epilogue')}}));break;
 case 'epilogue':
  O.push(opt('입증된 시설 안전 문제를 공개하고 미확인 내용은 제외한다',()=>ending(s.facts.includes('proofChain')&&s.facts.includes('relayLedger')?'campaignExpose':'campaignPartial')));
  O.push(opt('피해자 보호를 우선해 공식 기관에 증거를 비공개 제출한다',()=>ending(s.facts.includes('proofChain')?'campaignProtect':'campaignPartial')));
  if(s.flags.echoSeen||s.flags.callTruth)O.push(opt('설명되지 않은 17초의 음성 원본을 별도 봉인한다',()=>ending('campaignEcho')));break;
 case 'combat':O.push(opt('근접전투로 그림자를 밀어낸다',()=>combatAction('fight')));O.push(opt('공격을 피하고 구조대의 도움을 기다린다',()=>combatAction('dodge')));O.push(opt('탈출을 시도한다',()=>combatAction('flee')));break;
 case 'chase':O.push(opt('전력으로 달린다',()=>chaseAction('sprint')));O.push(opt('장애물을 넘어간다',()=>chaseAction('climb')));O.push(opt('안전한 우회로를 찾는다',()=>chaseAction('route')));break;
 case 'final':
  if(s.flags.officialTruth)O.push(opt('공식 기록을 보존하고 누락된 17분의 경위를 추가 수사한다',()=>{s.flags.officialCase=true;visit('chapter2')}));
  if(s.flags.officialPartial)O.push(opt('구조 기록을 보존하고 시험 시각의 모순을 추적한다',()=>{s.flags.officialCase=true;visit('chapter2')}));
  O.push(opt('어둠 속 그림자에 맞서 구조대의 퇴로를 확보한다',()=>combatStart(),!s.flags.combatDone));
  O.push(opt('닫히는 방화문을 피해 통로를 달린다',()=>chaseStart(),!s.flags.chaseDone));
  O.push(opt('구조를 마치고 현장을 보존한 뒤 후속 조사에 착수한다',()=>{s.flags.officialCase=true;visit('chapter2')}));
  O.push(opt('반복되는 전화벨을 따라 혼자 안쪽으로 들어간다',()=>{sanLoss(1+Math.floor(Math.random()*4),'알 수 없는 속삭임');if(!s.ended)ending('mystery')}));
  break;
 }
 return O.filter(x=>x.ok);
}
const ENDINGS={

 campaignExpose:'당신이 확보한 원본과 독립된 증거가 허위 점검 요청과 설비 안전 문제를 드러냈다. 기관은 비상 호출 중계 장치의 시험 기록을 보존하고 안전 조치에 착수했다. 이서윤의 구조 및 회복 경위는 당사자 동의 없는 추측으로 공개하지 않았다. 남은 17초의 음성은 설명되지 않는다.',
 campaignProtect:'당신은 확인된 증거를 공식 기관에 비공개로 제출했다. 설비 기록의 삭제가 중단되고 안전 점검이 시작됐다. 피해자 신원은 보호됐지만 시설 관리 책임을 공개적으로 밝히는 데는 시간이 걸린다. 마지막 통화의 목소리는 여전히 미스터리다.',
 campaignPartial:'기록 사이의 모순은 확인했지만 독립된 근거가 충분하지 않아 조작을 확정하지 않았다. 대신 위험 위치와 원본을 보존해 관계 기관에 전달했다. 무리한 결론을 피한 선택은 피해자 보호에 도움이 됐지만, 사건의 핵심 책임은 미해결로 남았다.',
 campaignEcho:'설비의 반복 신호와 사람의 기록 조작은 설명할 수 있다. 그러나 마지막 17초에는 아직 말하지 않은 당신의 문장이 먼저 녹음돼 있었다. 당신은 이 파일을 공개하지 않고 봉인했다. 사건의 인간적 책임을 추적하는 일과 이해할 수 없는 현상을 마주하는 일은 별개였다.',
 civilianEvidence:'당신은 확인된 원본과 출처를 정리해 제출했다. 경찰의 수사 결과는 알 수 없지만, 누군가가 남긴 세 번의 신호는 기록에서 지워지지 않았다. 마지막 페이지에는 당신의 이름으로 온 부재중 전화가 남는다.',
 civilianCautious:'당신은 확인하지 못한 사실을 단정하지 않았다. 사진·운행 기록·취재 자료는 안전하게 보존됐다. 한밤중 다시 울리는 전화에 답하지 않은 것은 비겁함이 아니라 당신의 선택이었다.',
 civilianMystery:'전화를 다시 걸자 익숙한 자신의 목소리가 “세 번째는 아직 오지 않았다”고 말했다. 화면에는 발신 기록이 없었다. 당신은 통화 파일을 보존했지만, 그날 이후 매일 02:17에 잠에서 깬다.',

 officialRevealed:'이서윤은 구조대의 응급 처치를 받고 이송됐다. 설비 담당자 입회 아래 세 번의 금속음이 비상 호출 중계 장치의 시험음이라는 사실을 확인했다. 공식 기록에는 고장과 점검 시각의 불일치가 남았다. 하지만 신고 음성의 숨소리와 당신의 목소리는 설명되지 않는다. 안전 확보와 진상 규명은 별개의 일임을 깨닫는다.',
 truthPublic:'공개 기록의 수정 이력, 반복 신호의 시험음, 시설 관계자의 답변이 맞물렸다. 당신은 비상 호출 중계 장치의 오작동과 점검 시각의 불일치를 근거로 알렸다. 설비는 점검 대상으로 지정되고 관련 기록은 보존됐다. 이서윤의 구체적인 구조 상황은 공개되지 않았다. 그런데 02:17, 저장한 음성에는 여전히 당신 자신의 목소리가 있다.',
 truthProtected:'당신은 신호의 기계적 원인과 점검 공고의 모순을 밝혔지만 피해자 신원과 미확인 추측은 공개하지 않았다. 관계 기관은 원본을 보존하고 설비 점검에 착수했다. 당신의 선택으로 검증 가능한 기록은 남았고, 실종자의 사생활은 지켜졌다. 단 하나, 음성 속 당신의 목소리는 아직 설명되지 않는다.',
 truthEcho:'중계 장치의 오작동은 설명할 수 있었다. 그러나 다시 건 전화에서는 아직 말하지 않은 당신의 문장이 먼저 흘러나왔다. 녹음에는 두 목소리의 시간차가 남는다. 기계적 고장 뒤에 설명할 수 없는 현상이 있음을 확인한 당신은 원본을 봉인한다. SAN을 잃었지만 진실의 마지막 층에 도달했다.',
 truthPartial:'공개 기록의 수정 사실과 반복되는 신호는 확인했다. 그러나 설비 오작동이 실종과 직접 관련됐다는 증거는 부족하다. 당신은 확정된 사실과 추정을 분리해 전달했다. 무리한 폭로는 피했지만 조사 결과는 부분적인 진실에 머문다. 02:17의 전화는 여전히 풀리지 않은 단서다.',
 pressHold:'기자는 확인되지 않은 음성 파일을 기사화하지 않았다. 원본을 보존한 채 추가 사실 확인을 기다린다. 아직 사건의 실체는 드러나지 않았다.',
 fireWait:'출동 주소가 특정되지 않은 상황에서 구조대는 상황실의 위치 확인을 기다린다. 무전기에서는 간헐적인 잡음이 이어진다. 이후의 대응은 새로운 신고와 지휘 명령에 달려 있다.',
 civilian:'담당자로부터 후속 연락이 왔다. 제출한 자료는 정식으로 접수됐고 추가 확인이 진행 중이라고 한다. 수사와 구조의 구체적인 경위는 공개되지 않았다. 당신이 알고 있는 것은 자신이 직접 확인한 사실뿐이다.',
 rescue:'이서윤은 병원으로 이송됐다. 설비실은 보존됐고, 전화의 기원은 밝혀지지 않았다. 새벽 02:17, 전화가 한 번 더 울린다.',
 safe:'설비 담당자가 차단 순서를 확인했다. 신호가 멎고 구조대가 이서윤을 이송한다. 그러나 누가 처음 전화를 걸었는지는 남은 의문이다.',
 risk:'무리한 전원 차단으로 장치 기록 일부가 사라졌다. 구조대는 이서윤을 대피시켰지만, 당신의 판단은 조사 기록에 남는다.',
 mystery:'안쪽에서 들려온 목소리는 당신 자신의 목소리였다. 누군가 “세 번째는 아직 오지 않았다”고 속삭인다. 당신은 구조대의 호출을 따라 밖으로 나왔다.',
 unconscious:'큰 부상으로 의식을 잃었다. 동료들이 당신을 구조했고 사건은 다른 조사자에게 넘어갔다.',
 insane:'이해할 수 없는 소리가 머릿속에서 끊이지 않는다. 동료들이 당신을 안전한 곳으로 옮겼다. 사건의 진실은 아직 남아 있다.'
};
function reset(){if(confirm('새 게임을 시작할까요? 현재 진행 상황이 삭제됩니다.')){s=fresh();save();render()}}
function create(){const name=$('#name')?.value.trim(),job=$('#job')?.value;if(!name){alert('이름을 입력해 주세요.');return}init(name,job)}
function tab(id){if(s.roll&&s.roll.value!==undefined&&id==='story')s.tab='result';else s.tab=id;save();render()}
function textScene(){
 const extra={
 intro:DESC.intro,
 hub:`확보한 단서 ${s.facts.length}개. ${s.facts.length?s.facts.slice(-3).map(k=>'• '+CLUES[k]).join('\n'):'아직 확인된 단서가 없다.'}\n\n${s.flags.submitted?'관련 자료가 담당 기관에 전달됐다.':'제보 여부는 아직 결정하지 않았다.'}`,
 apartment:DESC.apartment,room:DESC.room,basement:DESC.basement
 };
 return extra[s.scene]||DESC[s.scene]||'';
}
function sheet(){
 return `<div class="kicker">INVESTIGATOR RECORD · 7판 기반</div><h2>${esc(s.name)}의 조사자 시트</h2><p>${esc(s.job)} · 장비: ${esc(JOBDATA[s.job].gear)}</p>
 <div class="statgrid">${ATTRS.map((a,i)=>`<div class="stat"><b>${a}</b><strong>${s.attrs[i]}</strong><small>어려움 ${Math.floor(s.attrs[i]/2)} · 극단적 ${Math.floor(s.attrs[i]/5)}</small></div>`).join('')}</div>
 <h3>상태</h3><p>HP ${s.hp}/${s.maxhp} · SAN ${s.san}/${s.maxsan} · MP ${s.mp} · 행운 ${s.luck} ${s.insanity?'· 광기 상태':''} ${s.majorWound?'· 중상':''}</p><p>신용 ${s.credit} · 장비: ${esc(s.inventory.join(', '))}</p><h3>회복과 판정</h3><div class='choices'><button class='choice' onclick='recover()'>응급처치 판정</button><button class='choice' onclick='psychoanalysis()'>정신분석 판정</button><button class='choice' onclick='luckRoll()'>행운 판정</button></div>
 <h3>기술</h3><div class="skillgrid">${Object.keys(SKILL_BASE).map(k=>`<div><span>${esc(k)}</span><b>${skill(k)}%</b></div>`).join('')}</div>
 <p class="muted">직업별 사전 생성 조사자. 백분율 판정, 어려움·극단적 성공, 강행, 행운 소비, HP·SAN 손실을 사용해. 독립 시나리오를 위한 핵심 규칙 구현이며 정식 규칙서의 전체 내용을 대체하지 않아.</p>`;
}
function render(){
 disposeDice();const app=$('#app');if(!app)return;
 if(!s.name){app.innerHTML=`<div class="shell"><header class="hero" style="background-image:url(bg-river.webp)"><div><small>대구 · 새벽 02:17</small><h1>심연의 부재중 전화</h1></div></header><div class="layout"><main class="main"><div class="kicker">INVESTIGATOR CREATION</div><h2>조사자를 선택하세요</h2><p>원작의 분위기와 백분율 판정 체계에 기반한 독립 시나리오. 직업에 따라 기술과 장비가 다르며, 단서는 직접 행동해야 획득해.</p><label class="field">이름<input id="name" maxlength="20" placeholder="조사자 이름"></label><label class="field">직업<select id="job">${JOBS.map(j=>`<option>${j}</option>`).join('')}</select></label><button class="choice" onclick="create()">조사 시작</button></main></div></div>`;return}
 const portraits={형사:'detective',사진가:'photographer',택시기사:'taxi',기자:'reporter',소방관:'firefighter'};
 const bg={intro:'bg-river.webp',police:'bg-office.webp',photo:'bg-river.webp',photoNotice:'bg-river.webp',photoCompare:'bg-river.webp',taxi:'bg-river.webp',taxiRecord:'bg-river.webp',taxiNotice:'bg-river.webp',taxiHandoff:'bg-office.webp',policeBrief:'bg-office.webp',press:'bg-office.webp',pressScreen:'bg-office.webp',pressLead:'bg-office.webp',fire:'bg-office.webp',fireDispatch:'bg-office.webp',fireLink:'bg-office.webp',hub:'bg-office.webp',apartment:'bg-apartment.webp',floor:'bg-apartment.webp',room:'bg-apartment.webp',basement:'bg-basement.webp',victim:'bg-basement.webp',civilian:'bg-apartment.webp',civilianEnd:'bg-river.webp',final:'bg-basement.webp',ending:'bg-river.webp'}[s.scene]||'bg-office.webp';
 let body='';
 if(s.tab==='sheet')body=sheet();
 else if(s.tab==='clues')body=`<h2>수사 노트</h2>${s.notes.length?s.notes.map(n=>`<div class="source-card"><strong>${esc(CLUES[n.id])}</strong><p>확인 경위: ${esc(n.source)}</p></div>`).join(''):'<p>아직 직접 확인한 단서가 없어.</p>'}`;
 else if(s.tab==='log')body=`<h2>대화·행동 로그</h2><div class="paper log">${s.logs.map(l=>`<div class="logitem"><small>${esc(l.kind)} · ${l.turn}장면</small><div>${esc(l.msg)}</div></div>`).join('')}</div>`;
 else if(s.tab==='result'&&s.roll){const r=s.roll;const gap=r.value-r.target;body=`<h2>판정 실패</h2><p>${esc(r.skill)}: ${r.value} / 목표 ${r.target}</p><p>실패를 받아들이거나, 행운을 소모하거나, 위험을 감수하고 강행할 수 있어.</p><div class="choices"><button class="choice" onclick="failAccept()">실패의 대가를 받아들인다</button>${gap>0&&gap<=s.luck&&r.value<96&&!r.push?`<button class="choice" onclick="spendLuck()">행운 ${gap} 소비해 성공으로 바꾼다</button>`:''}${r.pushAvailable?'<button class="choice" onclick="push()">판정을 강행한다 (실패 시 HP·SAN 손실)</button>':''}${r.push?'<button class="choice" onclick="failPushed()">강행 실패의 대가를 감수한다</button>':''}</div>`}
 else if(s.roll){const r=s.roll;body=`<h2>${esc(r.label)} 판정</h2><p>기술 ${esc(r.skill)} ${skill(r.skill)}% · 난이도 ${r.diff}</p><p>일반 성공은 기술치 이하, 어려움은 절반, 극단적 성공은 1/5 이하여야 해.</p><section class="dice-panel"><div class="dice-label">기술 판정</div><div class="dice-target">${esc(r.skill)} · ${skill(r.skill)}% · ${r.diff}</div><div id="dice3d" class="dice3d dice-inline" aria-label="3D 백분율 주사위"></div><button class="choice dice-action" id="roll3d" disabled onclick="roll3D()">🎲 3D 백분율 주사위 준비 중…</button><button class="dice-fallback" onclick="roll3D(false)">애니메이션 없이 굴리기</button></section>`}
 else if(s.ended)body=`<div class="kicker">결말</div><h2>사건의 끝</h2><div class="story">${esc(s.ending==='civilian'?({사진가:'경찰은 사진의 촬영 시각과 위치를 확인했다. 사진 속 사람이 이서윤인지 확인되지 않았으므로 수사 결과는 알려주지 않았다. 당신은 원본을 보존하고, 다른 촬영본에 단서가 있는지 다시 살펴본다.',택시기사:'경찰은 휴대전화의 소유자가 이서윤임을 확인했지만 마지막 승객이 누구였는지는 아직 모른다고 했다. 당신이 전달한 운행 기록은 확인 자료로 남았다. 그날 밤의 승객은 여전히 이름 없는 사람이다.',기자:'경찰은 익명 제보를 접수했으나 실종 사건과의 연관성은 확인되지 않았다고 밝혔다. 당신은 음성 파일의 발신자를 특정하지 못했기에 기사화를 보류한다. 남은 것은 녹음 원본과 확인해야 할 질문들이다.'}[s.job]||ENDINGS.civilian):ENDINGS[s.ending]||'이야기가 끝났다.')}</div><p class="muted">결말은 조사와 선택의 결과야. 다른 선택으로 다시 도전할 수 있어.</p>${s.growthReport?`<div class="growth-report"><h3>성장 판정 결과</h3>${s.growthReport.map(line=>`<p>${esc(line)}</p>`).join('')}</div>`:'<button class="choice" onclick="advance()">성장 판정 실행</button>'}<button class="choice" onclick="reset()">새 게임 시작</button>`;
 else if(s.scene==='combat'&&s.combat)body=`<h2>전투 · ${s.combat.round}라운드</h2><p>그림자 HP ${Math.max(0,s.combat.enemyHP)} / ${s.combat.enemyMaxHP}</p><p>행동을 선택해. 공격·회피·탈출은 대항 판정과 피해를 적용해.</p><div class="choices">${options().map((o,i)=>`<button class="choice" onclick="act(${i})">${esc(o.label)}</button>`).join('')}</div>`;
 else if(s.scene==='chase'&&s.chase)body=`<h2>추격 · ${s.chase.round}라운드</h2><p>출구까지 ${s.chase.distance}구간 · 제한 ${s.chase.maxRound}라운드</p><div class="choices">${options().map((o,i)=>`<button class="choice" onclick="act(${i})">${esc(o.label)}</button>`).join('')}</div>`;
 else body=`<div class="kicker">대구 · ${s.turn}번째 장면</div><h2>${esc(({intro:'새벽 02:17',police:'실종 신고',photo:'거리 사진 정리',photoNotice:'동네 실종자 게시글',photoCompare:'촬영 기록 대조',taxi:'뒷좌석의 분실물',taxiRecord:'운행 기록',taxiNotice:'분실물 처리',taxiHandoff:'경찰 인계',policeBrief:'신고 내용 검토',press:'익명 제보',pressScreen:'메일 출처 확인',pressLead:'실종 게시물',fire:'긴급 신고',fireDispatch:'상황실 확인',fireLink:'경찰 공조',hub:'조사 선택',apartment:'청운아파트',floor:'704호 앞',room:'704호 내부',basement:'지하 설비실',victim:'실종자 발견',civilian:'현장 통제선',civilianEnd:'후속 연락',final:'남은 선택',officialTruth:'설비 기록 검증',photoTrail:'사진의 동선',photoWitness:'촬영 장소 재방문',photoArchive:'원본 사진 검증',photoShop:'상점의 기록',photoDecision:'사진의 단서',photoSignal:'반복되는 빛',taxiTrail:'운행 기록의 단서',taxiWitness:'목격자 확인',taxiDispatch:'취소된 호출',taxiRoad:'우회도로',taxiDecision:'운행 기록의 선택',taxiSignal:'블랙박스 신호',pressTrail:'취재의 시작',pressWitness:'상충하는 증언',pressSource:'두 번째 제보',pressConflict:'증언 검증',pressDecision:'보도 판단',pressSignal:'반복된 음성',civilianChoice:'의문의 전화',civilianCall:'수화기 너머',civilianResolve:'다음 날의 기록',civilianFollow:'세 번의 신호',civilianCross:'서로 다른 기록',civilianContact:'게시글 작성자',civilianMeeting:'카페에서의 만남',civilianPattern:'삭제 요구',civilianFinal:'마지막 판단',truthMap:'신호의 지리',truthSender:'익명 메시지의 출처',truthArchive:'수정된 공고',truthWitness:'외부 통로의 목격자',truthTheory:'세 번의 신호',truthRevelation:'중계 장치의 정체',truthConfront:'관리자의 답변',truthChoice:'진실을 어떻게 남길까',chapter2:'제2막 · 사라진 17분',archiveDesk:'바뀐 점검 공고',archiveAnswer:'수상한 접수번호',routeDesk:'서로 다른 동선',routeAnswer:'외부 출입구',voiceDesk:'음성의 앞과 뒤',voiceAnswer:'17초의 기록',chapter3:'제3막 · 지워진 교대 기록',workerInterview:'시설 직원의 진술',workerConflict:'관리업체의 답변',safetyChoice:'위험한 출입구',officialSafety:'공식 현장 공조',civilSafety:'외부에서의 안전 조치',chapter4:'제4막 · 두 종류의 진실',chainReview:'증거의 출처',chainChallenge:'관리업체의 반론',finalReveal:'사건의 진상',epilogue:'최후의 선택',verification:'접수 결과 확인',policeReview:'신고 기록 검토',policeInterview:'신고자 면담',fireSafety:'출동 준비',fireAssessment:'진입 위험 평가'})[s.scene]||'조사 기록')}</h2><div class="story">${esc(textScene())}</div><div class="choices">${options().map((o,i)=>`<button class="choice" onclick="act(${i})">${esc(o.label)}</button>`).join('')}</div>`;
 app.innerHTML=`<div class="shell"><div class="topbrand"><div><strong>심연의 부재중 전화</strong><small>백분율 판정 기반 미스터리 TRPG</small></div><div class="brandtools"><button onclick="tab('sheet')">▤ <span>캐릭터</span></button><button onclick="tab('clues')">▣ <span>소지품·단서</span></button><button onclick="tab('log')">▥ <span>기록</span></button><button onclick="reset()">⚙ <span>새 게임</span></button></div></div><header class="hero" style="background-image:url('${bg}')"><div class="location-tag">대구 · 새벽 02:17</div></header><div class="layout"><main class="main"><nav class="nav">${[['story','이야기'],['clues','수사 노트'],['sheet','캐릭터 시트'],['log',`행동 로그 (${s.logs.length})`]].map(([id,label])=>`<button class="${s.tab===id?'active':''}" onclick="tab('${id}')">${label}</button>`).join('')}</nav>${body}</main><aside class="portrait"><div class="face" style="background-image:url('portrait-${portraits[s.job]}.webp')"></div><div class="portrait-name">${esc(s.name)}<small>(${esc(s.job)})</small></div></aside></div><div class="hud"><div class="hud-stat">HP <b>${s.hp} / ${s.maxhp}</b><i><em style="width:${Math.max(0,s.hp/s.maxhp*100)}%;background:#ac3d38"></em></i></div><div class="hud-stat">SAN <b>${s.san} / ${s.maxsan}</b><i><em style="width:${Math.max(0,s.san/s.maxsan*100)}%;background:#4c90ac"></em></i></div><div class="hud-luck">행운 <b>${s.luck}</b></div></div></div>`;
 save();if(s.roll&&s.tab==='story')prepareDice();
}
window.__TRPG_TEST__={getState:()=>s,setState:x=>{s=x},init,visit,options,act,result,clue,ending,rollDice,skill,check,combatStart,combatAction,chaseStart,chaseAction,advance,opposed,recover,psychoanalysis,damage,sanLoss};
render();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
