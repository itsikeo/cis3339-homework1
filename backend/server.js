const express=require('express');const mongoose=require('mongoose');const path=require('path');
require('dotenv').config({path:path.join(__dirname,'../.env')});
const {Student,Course,Enrollment}=require('./models');const app=express();app.use(express.json());
const wrap=fn=>(req,res,next)=>Promise.resolve().then(()=>fn(req,res)).catch(next);
function fail(status,message){throw Object.assign(new Error(message),{status});}
function fields(body,keys){return Object.fromEntries(keys.map(key=>{const v=body?.[key];if(typeof v!=='string'||!v.trim()||v.trim().length>200)fail(400,`${key} is required (maximum 200 characters).`);return [key,v.trim()];}));}
// Serialize writes in the single local server to avoid enrollment/delete races.
let pending=Promise.resolve();function mutate(fn){const result=pending.then(fn);pending=result.catch(()=>{});return result;}
app.get('/api/students',wrap(async(req,res)=>{const q=typeof req.query.q==='string'?req.query.q.trim():'';const safe=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');res.json(await Student.find(q?{$or:[{name:{$regex:safe,$options:'i'}},{id:{$regex:safe,$options:'i'}}]}:{}).sort({name:1,id:1}));}));
app.get('/api/courses',wrap(async(req,res)=>res.json(await Course.find().sort({id:1}))));
for(const [route,Model,keys,ref] of [['students',Student,['name','id','phone','zip'],'student'],['courses',Course,['id','name'],'course']]){
 app.post('/api/'+route,wrap(async(req,res)=>{const data=fields(req.body,keys);res.status(201).json(await mutate(()=>Model.create(data)));}));
 app.delete('/api/'+route+'/:id',wrap(async(req,res)=>{await mutate(async()=>{const record=await Model.findOne({id:req.params.id});if(!record)fail(404,'Record not found.');await Enrollment.deleteMany({[ref]:record._id});await Model.deleteOne({_id:record._id});});res.json({message:'Deleted successfully, including related enrollments.'});}));
}
app.post('/api/enrollments',wrap(async(req,res)=>{const {studentId,courseId}=fields(req.body,['studentId','courseId']);const record=await mutate(async()=>{const [student,course]=await Promise.all([Student.findOne({id:studentId}),Course.findOne({id:courseId})]);if(!student||!course)fail(404,'Student or course not found.');return Enrollment.create({student:student._id,course:course._id});});res.status(201).json(record);}));
app.get('/api/courses/:id/students',wrap(async(req,res)=>{const course=await Course.findOne({id:req.params.id});if(!course)fail(404,'Course not found.');const rows=await Enrollment.find({course:course._id}).populate('student');res.json(rows.map(r=>r.student).filter(Boolean).sort((a,b)=>a.name.localeCompare(b.name)));}));
app.use('/api',(req,res)=>res.status(404).json({error:'API endpoint not found.'}));const dist=path.join(__dirname,'../dist');app.use(express.static(dist));app.get('*',(req,res,next)=>res.sendFile(path.join(dist,'index.html'),err=>{if(err)next(err);}));
app.use((err,req,res,next)=>{if(err.code===11000)return res.status(409).json({error:'Duplicate record: this ID or enrollment already exists.'});if(err.name==='ValidationError'||err.name==='CastError'||err.type==='entity.parse.failed')return res.status(400).json({error:'Invalid input.'});const status=err.status||500;if(status>=500)console.error(err.message);res.status(status).json({error:status>=500?'Server error. Check server logs.':err.message});});
async function connect(){if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is missing.');await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:5000});await Promise.all([Student.init(),Course.init(),Enrollment.init()]);}
async function start(){await connect();return app.listen(Number(process.env.PORT||3000),()=>console.log(`Student Management System: http://localhost:${process.env.PORT||3000}`));}
if(require.main===module)start().catch(async err=>{console.error('Startup failed:',err.message);await mongoose.disconnect();process.exitCode=1;});module.exports={app,connect};
