import {quotes,users} from './fakedb.js'
import {randomBytes} from 'crypto'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from './config.js'
const Quote = mongoose.model("Quote")
const User  = mongoose.model("User")

const resolvers ={
    Query:{
        users:async()=>await User.find({}),
        user:async(_,{_id})=>await User.findOne({_id}),
        quotes:async()=>await Quote.find({}).populate('by','_id firstName'),
        iquotes:async(_,{by})=>await Quote.find({by}), 
    },
    

    User:{
     quotes:async(ur)=> await Quote.find({by:ur._id})
    },
    Mutation:{
        signupUser:async(_,{userNew})=>{
             const user = await User.findOne({email:userNew.email})
             if(user){
                throw new Error("User already exist with this email")
             }

             const hashedPassword = await bcrypt.hash(userNew.password,10)

             const newUser = new User({
                ...userNew,
                password:hashedPassword
             })
             return await newUser.save()
        },
        signinUser:async(_,{userSignin})=>{
            const user = await User.findOne({email:userSignin.email})
            if(!user){
                throw new Error("User dosent exists with this email")
            }
            const doMatch = await bcrypt.compare(userSignin.password,user.password)
            if(!doMatch){
                throw new Error("email or password invalid")
            }

            const token = jwt.sign({UserId:user._id},JWT_SECRET)
            return {token}
        },
        createQuote:async(_,{name},{UserId})=>{
            if(!UserId) throw new Error("you must logged in first")

           const newQuote= new Quote({
                name,
                by:UserId
            })

            await newQuote.save()
            return "Quote saved successfully"
        }
    }

}

export default resolvers