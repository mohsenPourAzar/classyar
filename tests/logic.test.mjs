import test from 'node:test';
import assert from 'node:assert/strict';
await import('../src/logic.js');
const L=globalThis.ClassyarLogic;
const sample=()=>({version:1,classes:[],students:[],modules:[],components:[
 {id:'exam',moduleId:'m1',name:'آزمون',kind:'assessment',weight:15},
 {id:'exercise',moduleId:'m1',name:'تمرین',kind:'assessment',weight:4},
 {id:'att',moduleId:'m1',name:'حضور',kind:'attendance',weight:1}],
 sessions:[{id:'s1',moduleId:'m1'}],attendance:[],
 assessments:[{id:'a1',moduleId:'m1',componentId:'exam',maxScore:20},{id:'a2',moduleId:'m1',componentId:'exercise',maxScore:10}], marks:[]});
test('validates required arrays',()=>{
 assert.equal(L.validateDatabase(sample()),true);
 assert.equal(L.validateDatabase({classes:[]}),false);
});
test('does not treat missing marks as zero',()=>{
 const db=sample();db.attendance.push({sessionId:'s1',studentId:'alice',status:'present'});
 db.marks.push({assessmentId:'a1',studentId:'alice',score:16});
 const res=L.calculateModule(db,'alice','m1');assert.equal(res.complete,false);assert.equal(res.total,null);
});
test('computes exam 15, exercise 4, attendance 1 on 20 scale',()=>{
 const db=sample();db.attendance.push({sessionId:'s1',studentId:'alice',status:'present'});
 db.marks.push({assessmentId:'a1',studentId:'alice',score:16},{assessmentId:'a2',studentId:'alice',score:8});
 const res=L.calculateModule(db,'alice','m1');assert.equal(res.complete,true);assert.equal(res.total,16.2);
});
test('multiple exercises aggregate by their maximum scores',()=>{
 const db=sample();db.assessments.push({id:'a3',moduleId:'m1',componentId:'exercise',maxScore:30});
 db.marks=[{assessmentId:'a2',studentId:'alice',score:8},{assessmentId:'a3',studentId:'alice',score:12}];
 assert.equal(L.calculateComponent(db,'alice',db.components[1]).points,2);
});
test('absence permitted only when explicitly marked',()=>{
 const db=sample();db.attendance=[];
 assert.equal(L.calculateComponent(db,'alice',db.components[2]).complete,false);
 db.attendance.push({sessionId:'s1',studentId:'alice',status:'absent'});
 assert.equal(L.calculateComponent(db,'alice',db.components[2]).points,0);
});
test('excused absence is excluded, late earns half credit',()=>{
 const db=sample();db.sessions.push({id:'s2',moduleId:'m1'},{id:'s3',moduleId:'m1'});
 db.attendance=[{sessionId:'s1',studentId:'alice',status:'present'},{sessionId:'s2',studentId:'alice',status:'late'},{sessionId:'s3',studentId:'alice',status:'excused'}];
 const res=L.calculateComponent(db,'alice',db.components[2]);assert.equal(res.complete,true);assert.equal(res.points,.75);
});
test('all excused sessions remain incomplete rather than divide by zero',()=>{
 const db=sample();db.attendance=[{sessionId:'s1',studentId:'alice',status:'excused'}];
 assert.equal(L.calculateComponent(db,'alice',db.components[2]).complete,false);
});
test('weights must sum to 20 before a final score is issued',()=>{
 const db=sample();db.components[0].weight=10;
 db.attendance=[{sessionId:'s1',studentId:'alice',status:'present'}];db.marks=[{assessmentId:'a1',studentId:'alice',score:16},{assessmentId:'a2',studentId:'alice',score:8}];
 const result=L.calculateModule(db,'alice','m1');assert.equal(result.max,15);assert.equal(result.complete,false);
});
test('invalid scores cannot be graded',()=>{
 assert.equal(L.isScore(21,20),false);assert.equal(L.isScore(-1,20),false);
 assert.equal(L.isScore('',20),false);assert.equal(L.isScore(0,20),true);
});
