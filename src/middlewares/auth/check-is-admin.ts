import { Env } from "../../configs/env-config";
import { AUTHORIZATION_ROLES } from "../../constants/auth";
import { IAuthRequest } from "../../interfaces/User";
import { NextFunction, Response } from "express";
import { UnAuthorized } from "../error/app-error";
export const isAdmin = async(req:IAuthRequest, res:Response, next:NextFunction) => 
{
const user = req?.user;
 //  check if user is admin



 const adminEmails = Env?.ADMIN_EMAILS as string[];

 const isUserAdmin = user && user.role === AUTHORIZATION_ROLES.ADMIN && adminEmails?.includes(user.email)

 
if(!isUserAdmin){
    throw new UnAuthorized("Access denied. Admins only.")
}
next()

}