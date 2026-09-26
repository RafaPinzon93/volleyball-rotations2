/* Model regression tests. Loaded after app.js without a browser document. */
(() => {
  const {lineup,zoneAt,formation,receiveFormation,overlapChecks}=globalThis.SideoutModel;
  let checks=0;
  function assert(value,message){if(!value)throw new Error(message);checks++;}
  for(const system of ['5-1','6-2'])for(const libero of [false,true])for(let rotation=0;rotation<6;rotation++){
    const team=lineup(system,rotation,libero);
    const ready=receiveFormation(team),order=formation(team,'order'),receive=formation(team,'receive');
    const label=`${system} R${rotation+1} libero=${libero}`;
    assert(new Set(team.map(p=>p.zone)).size===6,label+' has six distinct slots');
    assert(team.filter(p=>p.isSetter).length===1,label+' has one active setter');
    assert(team.filter(p=>p.isFront).length===3,label+' has three front-row players');
    assert(team.filter(p=>p.isLibero).length===(libero?1:0),label+' libero count');
    assert(team.every(p=>!p.isLibero||!p.isFront),label+' no front-row libero');
    const setter=team.find(p=>p.isSetter);
    assert(system==='5-1'?setter.id==='s1':!setter.isFront,label+' setter assignment');
    assert(team.find(p=>p.id==='s1').zone===[1,6,5,4,3,2][rotation],label+' clockwise order');
    assert(JSON.stringify(ready)!==JSON.stringify(order),label+' tactical view differs from diagram');
    const z=Object.fromEntries(team.map(p=>[p.zone,ready[p.id]]));
    // Independent rule checks, not just trusting the UI's validator.
    assert(z[4][0]<z[3][0]&&z[3][0]<z[2][0],label+' front lateral order');
    assert(z[5][0]<z[6][0]&&z[6][0]<z[1][0],label+' back lateral order');
    assert(z[4][1]<z[5][1]&&z[3][1]<z[6][1]&&z[2][1]<z[1][1],label+' corresponding front/back order');
    const relationships=overlapChecks(team,ready);
    assert(relationships.length===7&&relationships.every(c=>c.legal),label+' all seven checks pass');
    // Each type of forbidden crossing must actually fail the checker.
    for(const relationship of relationships){
      const invalid=structuredClone(ready),axis=relationship.axis==='x'?0:1;
      invalid[relationship.first.id][axis]=invalid[relationship.second.id][axis]+1;
      assert(overlapChecks(team,invalid).some(c=>!c.legal),label+' catches an overlap');
    }
    // Moving from the order diagram to the formation must stay legal throughout.
    for(let step=0;step<=20;step++){
      const t=step/20;
      const positions=Object.fromEntries(team.map(p=>[p.id,order[p.id].map((v,i)=>v+(ready[p.id][i]-v)*t)]));
      assert(overlapChecks(team,positions).every(c=>c.legal),label+' legal pre-serve transition');
    }
    const passers=team.filter(p=>p.role==='OH'||p.role==='MB'&&!p.isFront);
    assert(passers.length===3,label+' three passers');
    assert(passers.every(p=>JSON.stringify(ready[p.id])===JSON.stringify(receive[p.id])),label+' passers do not relocate during serve');
    assert(Math.max(...passers.map(p=>ready[p.id][0]))-Math.min(...passers.map(p=>ready[p.id][0]))>=280,label+' passing width');
    for(const phase of ['ready','order','receive','set','attack']){
      const positions=formation(team,phase);
      assert(Object.values(positions).every(([x,y])=>x>115&&x<585&&y>88&&y<528),label+' in bounds '+phase);
      assert(new Set(Object.values(positions).map(p=>p.join(','))).size===6,label+' distinct positions '+phase);
    }
    if(setter.zone===5||setter.zone===6){
      const distance=p=>Math.hypot(p[0]-470,p[1]-150);
      assert(distance(ready[setter.id])<distance(order[setter.id]),label+' shorter setter release');
    }
    for(const player of team)assert(zoneAt(player.base,rotation+6)===player.zone,label+' full cycle');
  }
  for(let rotation=0;rotation<3;rotation++){
    const a=lineup('6-2',rotation,true),b=lineup('6-2',rotation+3,true);
    const pa=receiveFormation(a),pb=receiveFormation(b);
    for(const p of a){const q=b.find(q=>q.zone===p.zone);assert(JSON.stringify(pa[p.id])===JSON.stringify(pb[q.id]),'6-2 patterns repeat with opposite setter');}
  }
  globalThis.testResult=`PASS: ${checks} checks across 24 receiving configurations, including deliberate overlap faults.`;
})();
