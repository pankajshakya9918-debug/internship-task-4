import express from 'express';
import {readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const app=express(),port=process.env.PORT||3001,DB=new URL('./data.json',import.meta.url);
app.use(express.json({limit:'20kb'}));app.use(express.static('public'));
async function all(){try{return JSON.parse(await readFile(DB,'utf8'))}catch{return []}}
async function save(rows){await writeFile(DB,JSON.stringify(rows,null,2))}
function clean(body){return {company:String(body.company||'').trim().slice(0,100),role:String(body.role||'').trim().slice(0,100),status:String(body.status||'Applied'),date:String(body.date||''),link:String(body.link||'').trim().slice(0,500),notes:String(body.notes||'').trim().slice(0,1000)}}
app.get('/api/internships',async(req,res)=>res.json(await all()));
app.post('/api/internships',async(req,res)=>{const item=clean(req.body||{});if(!item.company||!item.role)return res.status(400).json({error:'Company and role are required.'});if(!['Applied','Interview','Offer','Rejected'].includes(item.status))return res.status(400).json({error:'Invalid status.'});const rows=await all();const record={id:randomUUID(),...item,createdAt:new Date().toISOString()};rows.unshift(record);await save(rows);res.status(201).json(record)});
app.put('/api/internships/:id',async(req,res)=>{const rows=await all(),i=rows.findIndex(x=>x.id===req.params.id);if(i<0)return res.status(404).json({error:'Record not found.'});const item=clean(req.body||{});if(!item.company||!item.role)return res.status(400).json({error:'Company and role are required.'});if(!['Applied','Interview','Offer','Rejected'].includes(item.status))return res.status(400).json({error:'Invalid status.'});rows[i]={...rows[i],...item};await save(rows);res.json(rows[i])});
app.delete('/api/internships/:id',async(req,res)=>{const rows=await all(),next=rows.filter(x=>x.id!==req.params.id);if(rows.length===next.length)return res.status(404).json({error:'Record not found.'});await save(next);res.json({success:true})});
app.listen(port,()=>console.log(`Internship Tracker running at http://localhost:${port}`));