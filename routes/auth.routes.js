const {Router} = require("express")
const router = Router()
const jwt=require("jsonwebtoken")
const User = require("../models/User")
const bcrypt = require("bcryptjs")
const config = require("../config/default.json")
const {check, validationResult} = require("express-validator")
// /api/auth/register
router.post("/register",
    [
        check("email", "Incorrect email").isEmail(),
        check("password", "incorrect password")
            .isLength({min: 6})
    ],
    async (req,
           res) => {
        try {
            const {email, password} = req.body
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array(), message: "errors occurred"})

            }
            const candidate = await User.findOne({email: email});
            if (candidate) {
                return res.status(400).json({message: "User already exists"})
            }
            const hashedPassword = await bcrypt.hash(password, 12)
            const user = new User({email, password: hashedPassword})
            await user.save();
            res.status(201).json({message: "user created"})
        } catch (e) {
            res.status(500).json({message: "smth went wrong"})
        }
    })
router.post("/login",
    [
        check("email", "incorrect mail").isEmail(),
        check("password", "Enter psw").exists()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(), message: "incorrect login or password"
                })

            }
            const {email, password} = req.body;
            const user = await User.findOne({email})
            if(!user){
                return  res.status(400).json({message :"user not foumd"})
            }
            const isMatch = await bcrypt.compare(password,user.password);
            if (!isMatch){
                return  res.status(400).json({message :"incorrect psw"})
            }
            const token = jwt.sign({userId:user.id},
                config.get("jwtSecret"),
                {expiresIn: "1h"})
            res.json({token,userId:user.id});
        } catch (e) {
            res.status(500).json({message: "smth went wrong"})
        }
    })
module.exports = router;