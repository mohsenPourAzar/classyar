/* Classyar report exporter: CSV and native XLSX (offline, no third-party dependency). */
(function(root){
'use strict';
const L=root.ClassyarLogic;
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const n=x=>Math.round((Number(x)+Number.EPSILON)*100)/100;
function listRows(db,classId,moduleId='all'){
  const klass=db.classes.find(c=>c.id===classId);
  if(!klass)throw Error('کلاس انتخاب نشده است');
  const students=db.students.filter(s=>s.classId===classId);
  const modules=db.modules.filter(m=>m.classId===classId).sort((a,b)=>a.order-b.order);
  if(moduleId==='all'){
    const headers=['ردیف','نام و نام خانوادگی','کد دانش‌آموزی',...modules.map(m=>m.name+' (از ۲۰)'),'میانگین پودمان‌ها (از ۲۰)','پودمان‌های تکمیل‌شده','وضعیت'];
    const rows=students.map((student,i)=>{
      const grades=modules.map(m=>L.calculateModule(db,student.id,m.id));
      const complete=grades.filter(g=>g.complete);
      const allFinished=modules.length>0 && complete.length===modules.length;
      const avg=allFinished?n(complete.reduce((sum,g)=>sum+g.total,0)/modules.length):'';
      return [i+1,student.name,student.studentCode||'',...grades.map(g=>g.complete?g.total:''),avg,`${complete.length} / ${modules.length}`,allFinished?'نهایی':'ناقص'];
    });
    return {klass,module:null,title:'خلاصه نمرات تمام پودمان‌ها',headers,rows,students:students.length,modules:modules.length};
  }
  const module=modules.find(m=>m.id===moduleId);
  if(!module)throw Error('پودمان انتخاب نشده است');
  const components=db.components.filter(c=>c.moduleId===module.id);
  const headers=['ردیف','نام و نام خانوادگی','کد دانش‌آموزی',...components.map(c=>`${c.name} (از ${c.weight})`),'نمره نهایی (از ۲۰)','وضعیت','موارد ناقص / توضیحات'];
  const rows=students.map((student,i)=>{
    const grade=L.calculateModule(db,student.id,module.id);
    return [i+1,student.name,student.studentCode||'',...grade.breakdown.map(x=>x.result.complete?x.result.points:''),grade.complete?grade.total:'',grade.complete?'نهایی':'ناقص',grade.configured?grade.pending.join('، '):`مجموع وزن بخش‌ها ${grade.max} از ۲۰ است`];
  });
  return {klass,module,title:`ریز نمرات ${module.name}`,headers,rows,students:students.length,modules:1};
}
const csvCell=v=>'"'+String(v??'').replace(/^[=+@\-\t\r]/,m=>"'"+m).replace(/"/g,'""')+'"';
function makeCSV(report){
  const heading=[['سامانه کلاس‌یار - لیست نمرات'],['کلاس',report.klass.name,'درس',report.klass.subject,'سال تحصیلی',report.klass.year],['گزارش',report.title],[],report.headers,...report.rows];
  return '\ufeff'+heading.map(r=>r.map(csvCell).join(',')).join('\r\n');
}
function colName(i){let s='';for(i++;i;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s;}
function sheetXML(report){
  const count=report.headers.length;
  const data=[['کلاس‌یار | '+report.title],['کلاس: '+report.klass.name,'درس: '+(report.klass.subject||'—'),'سال تحصیلی: '+(report.klass.year||'—')],[],report.headers,...report.rows];
  const width=Array.from({length:count},(_,i)=>i===1?34:i===2?20:i===count-1?29:Math.max(14,Math.min(25,(report.headers[i]||'').length+4)));
  const cols=width.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('');
  const rows=data.map((line,r)=>{
    const cells=line.map((v,c)=>{
      if(v===null || v===undefined || v==='')return '';
      const addr=colName(c)+(r+1);
      const header=r<4;
      const style=r===0?1:r===1?2:r===3?3:(typeof v==='number'?4:5);
      if(typeof v==='number' && !header && Number.isFinite(v))return `<c r="${addr}" s="${style}"><v>${v}</v></c>`;
      return `<c r="${addr}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
    }).join('');
    return `<row r="${r+1}"${r===0?' ht="34" customHeight="1"':r===3?' ht="38" customHeight="1"':''}>${cells}</row>`;
  }).join('');
  const last=colName(count-1);
  const lastrow=Math.max(4,data.length);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView rightToLeft="1" workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="25"/><cols>${cols}</cols><sheetData>${rows}</sheetData><mergeCells count="1"><mergeCell ref="A1:${last}1"/></mergeCells><autoFilter ref="A4:${last}${lastrow}"/><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" fitToWidth="1"/></worksheet>`;
}
function zipStore(parts){
  const encoder=new TextEncoder(), chunks=[],centers=[];let offset=0;
  const table=new Uint32Array(256);
  for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);table[i]=c>>>0;}
  function crc32(bytes){let crc=0xffffffff;for(const b of bytes)crc=table[(crc^b)&255]^(crc>>>8);return(crc^0xffffffff)>>>0;}
  function write16(arr,pos,v){arr[pos]=v&255;arr[pos+1]=(v>>>8)&255;}
  function write32(arr,pos,v){write16(arr,pos,v&65535);write16(arr,pos+2,v>>>16);}
  for(const [name,source] of parts){
    const fn=encoder.encode(name),body=encoder.encode(source),crc=crc32(body);
    const local=new Uint8Array(30+fn.length);
    write32(local,0,0x04034b50);write16(local,4,20);write16(local,8,0);write32(local,14,crc);write32(local,18,body.length);write32(local,22,body.length);write16(local,26,fn.length);local.set(fn,30);
    chunks.push(local,body);
    const central=new Uint8Array(46+fn.length);
    write32(central,0,0x02014b50);write16(central,4,20);write16(central,6,20);write32(central,16,crc);write32(central,20,body.length);write32(central,24,body.length);write16(central,28,fn.length);write32(central,42,offset);central.set(fn,46);centers.push(central);
    offset+=local.length+body.length;
  }
  const cdLen=centers.reduce((s,a)=>s+a.length,0),ending=new Uint8Array(22);
  write32(ending,0,0x06054b50);write16(ending,8,parts.length);write16(ending,10,parts.length);write32(ending,12,cdLen);write32(ending,16,offset);
  const all=[...chunks,...centers,ending];const out=new Uint8Array(all.reduce((s,a)=>s+a.length,0));let cur=0;for(const v of all){out.set(v,cur);cur+=v.length;}return out;
}
const stylesheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="11"/><name val="Tahoma"/><color rgb="FF334155"/></font><font><b/><sz val="17"/><name val="Tahoma"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="11"/><name val="Tahoma"/><color rgb="FF23345B"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF314BC9"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF0FF"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFE5EAF1"/></left><right style="thin"><color rgb="FFE5EAF1"/></right><top style="thin"><color rgb="FFE5EAF1"/></top><bottom style="thin"><color rgb="FFE5EAF1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="1" applyFill="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf><xf numFmtId="2" fontId="0" fillId="0" borderId="1" applyBorder="1" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
const names=reports=>reports.map((r,i)=>{const s=r.title.replace(/[\\/*?:\[\]]/g,'-').slice(0,27);return (i?s+' '+(i+1):s).slice(0,31);});
function makeXLSX(db,classId,moduleId='all'){
  const modules=db.modules.filter(m=>m.classId===classId).sort((a,b)=>a.order-b.order);
  const reports=moduleId==='all'?[listRows(db,classId,'all'),...modules.map(m=>listRows(db,classId,m.id))]:[listRows(db,classId,moduleId)];
  const sheetNames=names(reports);
  const wbSheets=sheetNames.map((name,i)=>`<sheet name="${esc(name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('');
  const rels=reports.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('');
  const types=reports.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
  const entries=[
    ['[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${types}</Types>`],
    ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${wbSheets}</sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}<Relationship Id="rId${reports.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml',stylesheet],...reports.map((r,i)=>[`xl/worksheets/sheet${i+1}.xml`,sheetXML(r)])
  ];
  return zipStore(entries);
}
root.ClassyarExport={listRows,makeCSV,makeXLSX};
})(typeof window!=='undefined'?window:globalThis);
