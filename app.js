/* Sideout Rotation Lab · GSAP timelines, no build step required. */
(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const NS = 'http://www.w3.org/2000/svg';
  const ZONES = {1:[490,405],2:[490,175],3:[350,175],4:[210,175],5:[210,405],6:[350,405]};
  const ORDER = [1,6,5,4,3,2];
  // Receiving examples keyed by the ACTIVE setter's rotational slot.
  // Coordinates represent floor-position anchors, not six fixed playing boxes.
  // The 6–2 repeats the three back-row-setter patterns with the setters exchanged.
  const RECEIVE = {
    1:{1:[550,425],2:[500,330],3:[350,155],4:[190,155],5:[205,355],6:[350,405]},
    6:{1:[515,370],2:[530,145],3:[420,145],4:[205,330],5:[350,405],6:[440,235]},
    5:{1:[520,365],2:[525,150],3:[230,335],4:[160,145],5:[245,235],6:[370,410]},
    4:{1:[555,445],2:[525,335],3:[455,215],4:[370,140],5:[195,350],6:[350,405]},
    3:{1:[515,350],2:[530,160],3:[435,145],4:[195,330],5:[320,405],6:[420,455]},
    2:{1:[515,355],2:[470,145],3:[215,330],4:[165,145],5:[155,450],6:[350,405]}
  };
  const SERVE_CONTACT = 3;
  const COLORS = {S:'#356c52',OH:'#6687b4',MB:'#bb9451',OPP:'#ca7964',L:'#9a82b1'};
  const NAMES = {S:'Setter',OH:'Outside hitter',MB:'Middle blocker',OPP:'Opposite',L:'Libero'};
  const PHASES = [
    {time:0, name:'Serve-receive setup', short:'Ready'},
    {time:3, name:'Receive & transition', short:'Receive'},
    {time:6, name:'The setter takes over', short:'Set'},
    {time:9, name:'Approach & attack', short:'Attack'},
    {time:12, name:'Point won · side-out', short:'Side-out'},
    {time:15, name:'Rotate clockwise', short:'Rotate'}
  ];
  const DURATION = 18;
  const state = {system:'5-1',rotation:0,role:'all',player:null,libero:true,paths:true,speed:1,phase:0,playing:false,startingView:'receive'};
  let timeline, roster = [], motion = [], lastPhase = -1, lastExchange = false;
  const ball = {x:505,y:26,alpha:1};
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function zoneAt(base, rotation) { return ORDER[(ORDER.indexOf(base) + rotation) % 6]; }
  function front(zone) { return zone >= 2 && zone <= 4; }
  function lineup(system, rotation, useLibero) {
    const specs = [['s1','S',1],['oh1','OH',2],['m1','MB',3],['s2',system === '6-2' ? 'S' : 'OPP',4],['oh2','OH',5],['m2','MB',6]];
    return specs.map(([id,role,base]) => {
      const zone = zoneAt(base,rotation);
      const isFront = front(zone);
      const isLibero = useLibero && role === 'MB' && !isFront;
      const isSetter = role === 'S' && (system === '5-1' || !isFront);
      const displayRole = isLibero ? 'L' : role === 'S' && !isSetter ? 'OPP' : role;
      const number = id.slice(-1);
      const code = isLibero ? 'L' : role === 'S' ? (system === '5-1' ? 'S' : `S${number}`) : role === 'OPP' ? 'OP' : role === 'MB' ? `M${number}` : `OH${number}`;
      return {id,role,base,zone,isFront,isLibero,isSetter,displayRole,code};
    });
  }

  function receiveFormation(players) {
    const template = RECEIVE[players.find(p => p.isSetter).zone];
    return Object.fromEntries(players.map(p => [p.id,[...template[p.zone]]]));
  }

  function overlapChecks(players, positions) {
    const byZone = Object.fromEntries(players.map(p => [p.zone,p]));
    // Strict separation is intentional: real rules allow some feet to be level.
    return [[4,3,'x'],[3,2,'x'],[5,6,'x'],[6,1,'x'],[4,5,'y'],[3,6,'y'],[2,1,'y']].map(([a,b,axis]) => {
      const first=byZone[a], second=byZone[b], index=axis==='x'?0:1;
      const margin=positions[second.id][index]-positions[first.id][index];
      return {first,second,axis,margin,legal:margin>0};
    });
  }

  function formation(players, phase) {
    if (phase === 'ready') return receiveFormation(players);
    const positions = {};
    const ready = receiveFormation(players);
    players.forEach(p => {
      if (phase === 'order') positions[p.id] = [...ZONES[p.zone]];
      // Passers are already in their lanes before the serve. They do not sprint
      // from a theoretical zone to a new passing spot while the serve is flying.
      else if (phase === 'receive' && (p.role === 'OH' || (p.role === 'MB' && !p.isFront))) positions[p.id] = [...ready[p.id]];
      else if (p.isSetter) positions[p.id] = [470,150];
      else if (p.role === 'MB' && !p.isFront) positions[p.id] = [350,430];
      else if (p.isFront && p.role === 'MB') positions[p.id] = phase === 'attack' ? [340,138] : [335,185];
      else if (p.isFront && p.role === 'OH') positions[p.id] = phase === 'attack' ? [172,132] : [168,237];
      else if (p.isFront && p.displayRole === 'OPP') positions[p.id] = phase === 'attack' ? [533,150] : [535,225];
      else if (p.role === 'OH') positions[p.id] = [230,395];
      else positions[p.id] = [490,425];
    });
    return positions;
  }

  const tips = {
    all:[['Know your neighbor.','Remember who is ahead of you and beside you before the serve. It is easier than memorizing six pictures.'],['Move after contact.','Your rotation spot is your starting point. Release into your playing role once the server contacts the ball.'],['Talk early, play simply.','Call the ball, give the setter space, and cover your hitter after the set.']],
    S:[['Beat the ball to the target.','Release after serve contact. Arrive balanced near the right side of the net and face your intended target.'],['Make the second touch yours.','Call “help” early when you take the first ball so a teammate can set.'],['Read the pass, then choose.','Use a high outside set when the pass is off the net. Add quick middle sets when the pass allows.']],
    OH:[['Pass, then get available.','Finish your platform, find the set, then move outside the sideline for a full approach.'],['Be the reliable outlet.','Expect high balls when the pass is imperfect. Keep the ball playable instead of forcing a winner.'],['See the block.','Look for the seam, use the outside hand, or hit deep corners. Cover teammates when they attack.']],
    MB:[['Read before you commit.','Watch the pass and the setter. Take an efficient first step so you can close the block.'],['Make your quick attack believable.','Approach with intent even when you are a decoy. Your timing can create space for the outside.'],['Land, turn, transition.','Get off the net after blocking and make yourself available again. Communicate your libero exchange.']],
    OPP:[['Own the right side.','Get wide enough to see the set. A patient approach gives you more options on a high ball.'],['Close the outside hitter’s block.','Line up with the opposing outside and communicate line or angle responsibility.'],['Be ready for the broken play.','Know who takes the second touch when the setter digs. Offer a clear attacking option.']],
    L:[['Read the server before the ball.','Watch the toss and contact. Start balanced and take your first step toward the ball’s path.'],['Give the setter room.','Aim a controlled pass slightly off the net. Call seams early and keep your platform quiet.'],['Know the front-zone setting rule.','A teammate cannot complete an above-net attack from your overhand finger set made in the front zone. Use a forearm set there.']]
  };

  function activeSetter(players = roster) { return players.find(p => p.isSetter); }
  function focusedPlayers() { return roster.filter(p => state.player ? p.id === state.player : state.role === 'all' || (state.role === 'S' ? p.role === 'S' : p.displayRole === state.role)); }
  function dynamicRole() {
    if (!state.player) return state.role;
    const player = roster.find(p => p.id === state.player);
    return player?.role === 'S' ? 'S' : player?.displayRole || state.role;
  }

  function phaseAdvice(role) {
    const setter = activeSetter();
    const setterName = setter.code;
    const selected = state.player && roster.find(p => p.id === state.player);
    if (state.phase === 0) {
      if (state.startingView === 'order') return 'This is the rotation-order diagram, not a passing formation. Press play to see the team arrange legally before the server hits the ball.';
      const checks = overlapChecks(roster,receiveFormation(roster));
      const player = selected || (role === 'S' ? setter : null);
      if (player) {
        const relationships = checks.filter(c => c.first.id===player.id || c.second.id===player.id).map(c => {
          const isFirst=c.first.id===player.id;
          return `${isFirst ? (c.axis==='x'?'left of':'ahead of') : (c.axis==='x'?'right of':'behind')} ${(isFirst?c.second:c.first).code}`;
        });
        return `${player.code} is still in rotational slot ${player.zone}: stay ${relationships.join(', ')} until the SERVER contacts the ball. Your slot does not require standing in that numbered area.`;
      }
      return `The outsides and ${state.libero?'libero':'back-row middle'} already cover three passing lanes. ${setter.code} waits in a legal release position. Hold relative order until the server hits the ball.`;
    }
    if (role === 'S' && state.system === '6-2' && selected?.isFront) {
      return [
        `${selected.code} is front row in zone ${selected.zone}, so you play right-side hitter. ${setterName} is the back-row setter for this rally.`,
        'You are the front-row setter/hitter: release toward the right-side attack position after serve contact. Your partner handles the second ball.',
        'Get available for a back set on the right. Your back-row partner is setting; you are a front-row attacker this rotation.',
        'The set goes to the outside in this example. Cover the attack and be ready for the next ball. As a front-row player, you can also block.',
        'Your team won the right to serve. Check whether your next zone puts you in the back row and changes your job to setter.',
        'Stay a right-side attacker while in the front row. When your slot enters the back row, take over setting from your partner.'
      ][state.phase];
    }
    const generic = [
      `Hold your receiving order until serve contact. ${setterName} starts in zone ${setter.zone}${setter.isFront ? ' in the front row' : ' in the back row'}.`,
      `The serve is in play. The back-row ${state.libero ? 'libero' : 'middle'} passes while ${setterName} releases to the setting target.`,
      `${setterName} takes the second contact. The front-row outside moves wide and the middle offers a quick option.`,
      'The front-row outside attacks on the third contact. Teammates prepare to cover a ball rebounding from the block.',
      'The attack wins the rally. Because your team was receiving, you earn a point and the right to serve: a side-out.',
      `Move one zone clockwise. Zone 2 goes to zone 1 to serve. ${state.libero ? 'The libero and middles exchange back-row responsibility.' : 'Keep the same service order.'}`
    ];
    const advice = {
      S:[
        state.system === '6-2' ? `${setterName} is the back-row setter this rotation. The other setter plays right-side hitter while in the front row.` : `Start in zone ${setter.zone}. You set in all six rotations; your front- or back-row status still determines attack and block restrictions.`,
        'Release only after serve contact. Find the pass and arrive at the target under control; avoid crossing a passer’s platform.',
        setter.isFront ? 'You are front row: set the hitter and keep the option to attack a tight second ball.' : 'You are back row: you may set at the net, but cannot block or dump a ball that is entirely above the net from the front zone.',
        'After the set, cover behind the hitter. Be ready for a blocked ball coming back into your court.',
        'Call the next rotation and confirm the next server. A won receiving rally means everyone rotates.',
        state.system === '6-2' ? 'Check which setter is now back row. The setting responsibility switches when the two setters change rows.' : 'Your starting zone changes, but you remain the setter. Check your new row before the next rally.'
      ],
      OH:[
        'Locate your opposite outside hitter in the order. One outside is always front row and the other is back row.',
        'Help the libero cover serve receive. After your pass, release wide if you are the front-row outside.',
        'The front-row outside gets off the net to approach. The back-row outside stays available for defense and coverage.',
        'The front-row outside takes this example’s set. A back-row attack must take off from behind the 3 m line if contact is above the net.',
        'Celebrate, then identify the player you follow in service order. Only rotate because your team won the right to serve.',
        'Rotate with your slot, then check your row. Your next job changes between left-side attacking and back-court coverage.'
      ],
      MB:[
        state.libero ? 'The front-row middle stays on court. The libero occupies the other middle’s back-row slot in this lesson.' : 'One middle starts front row and one back row. With no libero, the back-row middle also helps pass and defend.',
        'The front-row middle releases from the receiving order and gets ready to approach. Read the quality of the first pass.',
        'Show a quick attack down the middle. Even as a decoy, a convincing approach can hold the opposing middle blocker.',
        'Transition into coverage around the outside hitter. In a real rally, be ready to return to blocking if the opponent digs.',
        'Check whether your next zone is front or back row. Coordinate the libero replacement while the ball is dead.',
        state.libero ? 'A middle returns when their slot enters the front row. The libero then covers the other middle’s back-row slot; exchanges are condensed here.' : 'Follow the clockwise order. Back-row status remains in effect even if you move close to the net during play.'
      ],
      OPP:[
        state.system === '6-2' ? 'In this 6–2, the front-row setter becomes the opposite hitter. The back-row setter runs the offense.' : 'You are opposite the setter in the rotation. When the setter is back row, you are a front-row attacking option.',
        'Stay out of the passers’ lanes and move toward the right-side attack position after serve contact.',
        'If front row, get wide and ready for a back set. If back row in a 5–1, stay behind the attack line for any above-net attack takeoff.',
        'The set goes outside in this example. Cover the hitter and stay prepared for a rebound instead of watching the ball.',
        'Find your next zone and confirm your front- or back-row assignment before the next serve.',
        state.system === '6-2' ? 'If the front-row setter rotates into the back row, they become the setter. Their opposite partner becomes the right-side attacker.' : 'Move one zone clockwise, staying opposite the setter in the rotation order.'
      ],
      L:[
        'You replace the back-row middle in this lesson. Keep their position in the receiving order until serve contact.',
        'Read the serve and call the ball early. This rally sends the serve to you: pass toward the setter, slightly off the net.',
        'The setter takes the second ball. Recover to cover the hitter and watch for a short rebound.',
        'Stay low and ready to cover. You cannot block, attempt to block, or complete an attack with the ball entirely above the net.',
        'Check the middle’s new row before the next serve. Libero replacements happen while the ball is out of play.',
        'Never follow a slot into the front row as libero. The middle returns first; you cover a back-row middle instead. This animation condenses the exchange.'
      ]
    };
    return (advice[role] || generic)[state.phase];
  }

  function updateCoach() {
    const role = dynamicRole();
    const selected = state.player && roster.find(p => p.id === state.player);
    const setter = activeSetter();
    const descriptions = {
      all:state.system === '5-1' ? 'One setter leads every rotation. Five players share the hitting roles, with two or three front-row attackers depending on where the setter starts.' : 'Two setters share the job. The back-row setter runs the offense; the front-row setter attacks on the right. Three front-row attackers stay available.',
      S:state.system === '5-1' ? 'The playmaker. You connect the pass to the attack, taking the second ball and choosing who gets the swing — in every rotation.' : 'Two playmakers, one setting at a time. Set from the back row; become a right-side attacker when you rotate into the front row.',
      OH:'The all-rounder. Pass the serve, attack from the left, and help stabilize the team when the play gets messy. Your two outsides start opposite each other.',
      MB:'The quick threat. Attack through the center and organize the block. Your first step and timing matter more than covering the most ground.',
      OPP:state.system === '6-2' ? 'The right-side threat. In this version of the 6–2, the front-row setter fills this role while their back-row partner sets.' : 'The right-side threat. You balance the outside hitter, block the opponent’s left-side attack, and play opposite the setter in the order.',
      L:'The back-court specialist. You anchor serve receive and defense, replacing a middle in the back row. Your calm first contact starts a good attack.'
    };
    const titles = {all:'Six players. One rhythm.',S:'Make the next ball better.',OH:'Pass. Approach. Put it away.',MB:'Quick feet. Bigger impact.',OPP:'Bring balance to the attack.',L:'Great plays start with you.'};
    $('#focus-tag').textContent = selected ? `FOLLOWING ${selected.code} · ${NAMES[role].toUpperCase()}` : role === 'all' ? 'THE BIG PICTURE' : `POSITION FOCUS · ${NAMES[role].toUpperCase()}`;
    $('#focus-title').textContent = titles[role];
    $('#focus-description').textContent = descriptions[role];
    $('#stat-one-label').textContent = selected ? 'STARTING ZONE' : role === 'all' ? 'SYSTEM' : 'YOUR ROLE';
    $('#stat-one-value').textContent = selected ? `Zone ${selected.zone} · ${selected.isFront ? 'Front' : 'Back'} row` : role === 'all' ? (state.system === '5-1' ? '5 hitters · 1 setter' : '6 hitters · 2 setters') : ({S:'Second contact',OH:'Pass + left-side attack',MB:'Quick attack + block',OPP:'Right-side attack',L:'Pass + defense'})[role];
    $('#stat-two-label').textContent = role === 'all' ? 'AT THE NET' : 'THIS ROTATION';
    $('#stat-two-value').textContent = role === 'all' ? `${setter.isFront ? 2 : 3} attackers` : role === 'S' ? `${setter.code} sets · zone ${setter.zone}` : role === 'L' ? (state.libero ? 'Replaces back-row middle' : 'Enable “Use libero”') : selected ? selected.isFront ? 'Front-row player' : 'Back-row player' : role === 'OPP' && state.system === '6-2' ? 'Front-row setter hits' : 'Follow the court markers';
    $('#phase-tip').textContent = phaseAdvice(role);
    $('#tips').innerHTML = tips[role].map(([title,body],i) => `<div class="tip"><span class="tip-number">0${i+1}</span><div><strong>${title}</strong><p>${body}</p></div></div>`).join('');
    $$('[data-role]').forEach(button => {const active = button.dataset.role === role;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
  }

  function svgElement(tag,attributes,parent) {
    const element = document.createElementNS(NS,tag);
    Object.entries(attributes).forEach(([key,value]) => element.setAttribute(key,String(value)));
    if (parent) parent.appendChild(element);
    return element;
  }

  function createPlayers() {
    $('#players').replaceChildren();
    const start=formation(roster,state.startingView==='order'?'order':'ready');
    motion = roster.map(p => {
      const node = svgElement('g',{class:'player',role:'button',tabindex:0,'data-player':p.id},$('#players'));
      svgElement('circle',{class:'focus-ring',r:34},node);
      svgElement('circle',{class:'player-disc',r:26,fill:COLORS[p.displayRole]},node);
      const code = svgElement('text',{class:'player-code',y:0},node);code.textContent=p.code;
      const label = svgElement('text',{class:'player-name',y:44},node);label.textContent=p.isSetter ? 'Setter' : p.role === 'S' ? 'Right-side hitter' : NAMES[p.displayRole];
      svgElement('circle',{class:'row-indicator',cx:20,cy:-20,r:8},node);
      const row = svgElement('text',{class:'row-text',x:20,y:-20},node);row.textContent=p.isFront ? 'F' : 'B';
      const focus = () => {
        state.player = state.player === p.id ? null : p.id;
        state.role = state.player ? (p.role === 'S' ? 'S' : p.displayRole) : 'all';
        applyFocus();updateCoach();
      };
      node.addEventListener('click',focus);
      node.addEventListener('keydown',event => {if(event.key === 'Enter' || event.key === ' '){event.preventDefault();focus();}});
      return {id:p.id,node,x:start[p.id][0],y:start[p.id][1]};
    });
  }

  function applyFocus() {
    const focused = focusedPlayers().map(p => p.id);
    motion.forEach(m => {
      const isSelected = state.role !== 'all' && focused.includes(m.id);
      m.node.classList.toggle('selected',isSelected);
      m.node.style.opacity = state.role === 'all' || focused.includes(m.id) ? '1' : '.28';
      m.node.setAttribute('aria-pressed',String(isSelected));
    });
    drawPaths();
  }

  function drawPaths() {
    const container = $('#movement-paths');container.replaceChildren();
    if (!state.paths) return;
    const targets = formation(roster,state.phase <= 1 ? 'receive' : state.phase <= 2 ? 'set' : 'attack');
    const starts = formation(roster,state.phase <= 1 ? 'ready' : state.phase === 2 ? 'receive' : 'set');
    const focused = focusedPlayers().map(p => p.id);
    roster.forEach(p => {
      if (state.role !== 'all' && !focused.includes(p.id)) return;
      let start = starts[p.id], end = targets[p.id];
      if(state.phase===0 && state.startingView==='order') {start=ZONES[p.zone];end=formation(roster,'ready')[p.id];}
      if(state.phase >= 4) {start=ZONES[p.zone];end=ZONES[zoneAt(p.base,(state.rotation+1)%6)];}
      if(Math.hypot(end[0]-start[0],end[1]-start[1]) < 22) return;
      const dx=end[0]-start[0],dy=end[1]-start[1];
      const control=[(start[0]+end[0])/2-dy*.1,(start[1]+end[1])/2+dx*.1];
      svgElement('path',{d:`M${start[0]} ${start[1]} Q${control[0]} ${control[1]} ${end[0]} ${end[1]}`},container);
    });
  }

  function updateFormationLesson() {
    const checks=overlapChecks(roster,receiveFormation(roster));
    $('#overlap-summary').textContent=`Why this receive formation is legal · ${checks.filter(c=>c.legal).length}/7 relationships`;
    $('#overlap-checks').innerHTML=checks.map(c=>`<li><span aria-hidden="true">${c.legal?'✓':'!'}</span> ${c.first.code} <span class="relation">${c.axis==='x'?'left of':'closer to net than'}</span> ${c.second.code}</li>`).join('');
    const zone=activeSetter().zone;
    const explanations={
      1:'The setter stays behind the right-side outside passer. There is a longer release here: moving closer to the net before contact would overlap that passer.',
      6:'The setter pushes forward between the two back-row teammates, while staying behind the front-middle player. Front-row and back-row players can interleave.',
      5:'The setter pushes forward behind the front-left middle and stays left of the back-middle outside. This shortens the release without crossing a required neighbor.',
      4:'The front-row setter shifts toward the setting target. The middle and front-row outside remain to the setter’s right, preserving the front-row order.',
      3:'The setter waits close to the target, between the front-row outside and middle. The opposite stays deeper in the corresponding back-middle slot.',
      2:'The setter is already near the target on the right. The front-row outside drops into passing while staying ahead of the corresponding back-row outside.'
    };
    $('#formation-explanation').textContent=explanations[zone];
    $$('[data-starting-view]').forEach(b=>{const active=b.dataset.startingView===state.startingView;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }

  function updateIdentity(exchanged) {
    const visualRoster = exchanged ? lineup(state.system,(state.rotation+1)%6,state.libero) : roster;
    motion.forEach(m => {
      const p = visualRoster.find(player => player.id === m.id);
      m.node.querySelector('.player-code').textContent=p.code;
      m.node.querySelector('.player-disc').setAttribute('fill',COLORS[p.displayRole]);
      m.node.querySelector('.player-name').textContent=p.isSetter ? 'Setter' : p.role === 'S' ? 'Right-side hitter' : NAMES[p.displayRole];
      m.node.querySelector('.row-text').textContent=p.isFront ? 'F' : 'B';
      m.node.setAttribute('aria-label',`${p.code}, ${p.role === 'S' && !p.isSetter ? 'setter currently playing right-side hitter' : NAMES[p.displayRole]}, zone ${p.zone}, ${p.isFront ? 'front' : 'back'} row. Click to focus.`);
    });
    // Focus stays attached to the chosen role through the condensed libero exchange.
    if(exchanged && !state.player && state.role !== 'all') {
      motion.forEach(m => {const p=visualRoster.find(player=>player.id===m.id);const selected=state.role==='S'?p.role==='S':p.displayRole===state.role;m.node.style.opacity=selected?'1':'.28';m.node.classList.toggle('selected',selected);m.node.setAttribute('aria-pressed',String(selected));});
    } else applyFocus();
  }

  function render() {
    const time = timeline ? timeline.time() : 0;
    motion.forEach(m => m.node.setAttribute('transform',`translate(${m.x.toFixed(2)} ${m.y.toFixed(2)})`));
    $('#ball').setAttribute('transform',`translate(${ball.x.toFixed(2)} ${ball.y.toFixed(2)})`);
    $('#ball').style.opacity = ball.alpha;
    $('#scrubber').value = time;
    $('#scrubber').style.setProperty('--progress',`${time/DURATION*100}%`);
    $('#time-display').textContent=`0:${Math.floor(time).toString().padStart(2,'0')} / 0:18`;
    const phase = Math.min(5,Math.floor(time/3));
    if(phase !== lastPhase) {
      state.phase=phase;lastPhase=phase;
      $('#court-phase').textContent=PHASES[phase].name;
      $('#contact-status').textContent=phase===0?'BEFORE SERVE · HOLD ORDER':phase<4?'SERVE HIT · FREE TO MOVE':'RALLY OVER · BALL DEAD';
      $('#contact-status').classList.toggle('released',phase>0&&phase<4);
      $$('[data-phase]').forEach(b=>{const active=Number(b.dataset.phase)===phase;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
      updateCoach();drawPaths();
    }
    $('#scrubber').setAttribute('aria-valuetext',`${PHASES[phase].short}, ${time.toFixed(1)} seconds`);
    const exchanged=time>=17.2;
    if(exchanged !== lastExchange){lastExchange=exchanged;updateIdentity(exchanged);}
  }

  function tweenPositions(tl,targets,time,duration) {
    motion.forEach(m => tl.to(m,{x:targets[m.id][0],y:targets[m.id][1],duration:reducedMotion ? Math.min(.15,duration) : duration,ease:'power2.inOut'},time));
  }

  function buildTimeline(autoplay = false) {
    if(timeline) timeline.kill();
    roster=lineup(state.system,state.rotation,state.libero);
    lastPhase=-1;lastExchange=false;state.phase=0;
    createPlayers();applyFocus();updateIdentity(false);
    Object.assign(ball,{x:505,y:26,alpha:1});
    const ready=formation(roster,'ready'),order=formation(roster,'order'),receive=formation(roster,'receive'),set=formation(roster,'set'),attack=formation(roster,'attack');
    const next=lineup(state.system,(state.rotation+1)%6,state.libero);
    const rotationTargets=Object.fromEntries(next.map(p=>[p.id,ZONES[p.zone]]));
    const tl=gsap.timeline({paused:true,onUpdate:render,onComplete:()=>{
      if($('#continuous').checked && state.playing) {state.rotation=(state.rotation+1)%6;buildTimeline(true);}
      else {state.playing=false;updatePlayButton();}
    }});
    timeline=tl;
    const clock={time:0};tl.to(clock,{time:DURATION,duration:DURATION,ease:'none'},0);
    if(state.startingView==='order')tweenPositions(tl,ready,.5,1.7);
    tweenPositions(tl,receive,SERVE_CONTACT,1.5);
    const passer=roster.find(p=>p.role==='MB'&&!p.isFront);
    const [passX,passY]=receive[passer.id];
    tl.to(ball,{x:passX,y:passY-18,duration:1.6,ease:'power1.in'},SERVE_CONTACT);
    tl.to(ball,{x:(passX+470)/2,y:233,duration:.85,ease:'power1.out'},4.85);
    tl.to(ball,{x:470,y:129,duration:.65,ease:'power1.in'},5.7);
    tweenPositions(tl,set,5.7,1.4);
    tl.to(ball,{x:345,y:69,duration:1,ease:'power1.out'},6.5);
    tl.to(ball,{x:180,y:103,duration:1.55,ease:'power1.in'},7.5);
    tweenPositions(tl,attack,8.1,.95);
    tl.to(ball,{x:420,y:9,duration:1.1,ease:'power2.in'},9.2);
    tl.to(ball,{alpha:0,duration:.4},11.7);
    // Return to the order diagram only once the rally is dead, to teach rotation.
    tweenPositions(tl,order,12.7,1.5);
    tweenPositions(tl,rotationTargets,15.15,1.9);
    tl.timeScale(state.speed);
    $('#court-title').textContent=`Rotation ${state.rotation+1}`;
    const setter=activeSetter();
    $('#setter-badge').innerHTML=`<span></span> ${state.system === '6-2' ? setter.code+' sets from the back row' : 'Setter in the '+(setter.isFront ? 'front' : 'back')+' row'}`;
    $$('[data-rotation]').forEach(button=>{const active=Number(button.dataset.rotation)===state.rotation;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    $$('[data-system]').forEach(button=>{const active=button.dataset.system===state.system;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});
    state.playing=autoplay;render();updateCoach();updatePlayButton();updateFormationLesson();
    if(autoplay)tl.play(0);
  }

  function updatePlayButton() {
    $('#play span').textContent=state.playing ? 'Pause rally' : timeline && timeline.time() >= DURATION ? 'Replay rally' : 'Play rally';
    $('#play svg').innerHTML=state.playing ? '<path d="M7 5h3v14H7zM15 5h3v14h-3z"/>' : '<path d="m9 5 10 7-10 7z"/>';
    $('#play').setAttribute('aria-label',state.playing ? 'Pause rally' : 'Play rally');
  }
  function pause() {state.playing=false;timeline.pause();updatePlayButton();}
  function playPause() {if(state.playing) pause();else {if(timeline.time()>=DURATION)timeline.seek(0);state.playing=true;timeline.play();updatePlayButton();}}
  function changeRotation(delta) {state.rotation=(state.rotation+delta+6)%6;buildTimeline(false);}
  function seek(time) {pause();timeline.time(time,true);render();updatePlayButton();}

  function init() {
    if(!window.gsap) {
      const banner=document.createElement('div');banner.className='error-banner';banner.textContent='The animation library could not load. Keep the vendor folder beside index.html and reopen the page.';document.body.append(banner);return;
    }
    $('#rotations').innerHTML=Array.from({length:6},(_,i)=>`<button data-rotation="${i}" aria-label="Rotation ${i+1}" aria-pressed="${i===0}">${i+1}</button>`).join('');
    $$('[data-system]').forEach(b=>b.addEventListener('click',()=>{state.system=b.dataset.system;state.player=null;buildTimeline();}));
    $$('[data-starting-view]').forEach(b=>b.addEventListener('click',()=>{state.startingView=b.dataset.startingView;buildTimeline();}));
    $$('[data-role]').forEach(b=>b.addEventListener('click',()=>{
      state.role=b.dataset.role;state.player=null;
      if(state.role==='L'&&!state.libero){state.libero=true;$('#libero').checked=true;buildTimeline(false);}
      else{applyFocus();if(lastExchange)updateIdentity(true);updateCoach();}
    }));
    $$('[data-rotation]').forEach(b=>b.addEventListener('click',()=>{state.rotation=Number(b.dataset.rotation);buildTimeline();}));
    $$('[data-phase]').forEach(b=>b.addEventListener('click',()=>seek(PHASES[Number(b.dataset.phase)].time)));
    $('#play').addEventListener('click',playPause);
    $('#previous').addEventListener('click',()=>changeRotation(-1));$('#next').addEventListener('click',()=>changeRotation(1));
    $('#speed').addEventListener('change',event=>{state.speed=Number(event.target.value);timeline.timeScale(state.speed);});
    $('#scrubber').addEventListener('input',event=>seek(Number(event.target.value)));
    $('#paths').addEventListener('change',event=>{state.paths=event.target.checked;drawPaths();});
    $('#libero').addEventListener('change',event=>{state.libero=event.target.checked;if(!state.libero&&state.role==='L'){state.role='MB';state.player=null;}buildTimeline();});
    $('#zones').addEventListener('click',()=>{const visible=$('#zones').getAttribute('aria-pressed')!=='true';$('#zone-labels').style.display=visible?'':'none';$('#zones').setAttribute('aria-pressed',String(visible));$('#zones').textContent=visible?'Hide zones':'Show zones';});
    $('#reset').addEventListener('click',()=>{state.rotation=0;state.role='all';state.player=null;buildTimeline();});
    const openGuide=()=>{pause();$('#guide').showModal();};
    $('#guide-open').addEventListener('click',openGuide);$('#rules-open').addEventListener('click',openGuide);$('#guide-close').addEventListener('click',()=>$('#guide').close());
    $('#guide').addEventListener('click',event=>{if(event.target===$('#guide')){const r=$('#guide').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('#guide').close();}});
    document.addEventListener('keydown',event=>{
      if($('#guide').open||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.target.closest('button,input,select,a,[role="button"]'))return;
      if(event.code==='Space'){event.preventDefault();playPause();}
      if(event.key==='ArrowRight'){event.preventDefault();changeRotation(1);}
      if(event.key==='ArrowLeft'){event.preventDefault();changeRotation(-1);}
    });
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.playing)pause();});
    buildTimeline();
  }
  // Pure model functions are exposed for verification and future lesson extensions.
  globalThis.SideoutModel=Object.freeze({lineup,zoneAt,formation,front,receiveFormation,overlapChecks});
  if(typeof document!=='undefined')init();
})();
