import jwt from 'jsonwebtoken'
import {v4 as uuidv4} from 'uuid'

const denylist = new Set()
export const createToken = (payload) =>{
    const jti = uuidv4()
    const token = jwt.sign(
        {...payload, jti},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES || '1h'}
    )
    return{token, jti}
}
export const isDenied=(jti) =>denylist.has(jti)
export const denyToken = (jti) =>{
    if(jti) denylist.add(jti)
}
export const verifyToken = (token) => new Promise(
    (resolve, reject) =>{
        jwt.verify(
            token, process.env.JWT_SECRET,
            (err, decoded) =>{
                if(err) return reject(err)
                    if(isDenied(decoded.jti))
                        return reject(new Error('Token denylisted'))
                    resolve(decoded)
            }
        )
    }
)