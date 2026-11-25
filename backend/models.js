const mongoose=require('mongoose');const {Schema}=mongoose;
const field=()=>({type:String,required:true,trim:true,maxlength:200});
const student=new Schema({name:field(),id:{...field(),unique:true},phone:field(),zip:field()},{versionKey:false,id:false});
const course=new Schema({id:{...field(),unique:true},name:field()},{versionKey:false,id:false});
const enrollment=new Schema({student:{type:Schema.Types.ObjectId,ref:'Student',required:true},course:{type:Schema.Types.ObjectId,ref:'Course',required:true}},{versionKey:false});
enrollment.index({student:1,course:1},{unique:true});enrollment.index({course:1});
module.exports={Student:mongoose.model('Student',student),Course:mongoose.model('Course',course),Enrollment:mongoose.model('Enrollment',enrollment)};
