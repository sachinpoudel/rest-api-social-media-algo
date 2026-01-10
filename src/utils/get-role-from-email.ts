import { Env } from "../configs/env-config"
import { AUTHORIZATION_ROLES } from "../constants/auth";

export const getRoleFromEmail = (email:string) :string => {
    const {ADMIN_EMAILS,SUPERVISOR_EMAILS,MODERATOR_EMAILS } = Env;

    const parseEmailList = (emailStr: string | undefined): string[] => {
        if (!emailStr) return [];
        
        if (emailStr.trim().startsWith('[')) {
            try {
                return JSON.parse(emailStr);
            } catch {
                return [];
            }
        }
        
        return emailStr.split(',').map(e => e.trim()).filter(e => e.length > 0);
    };

    if(ADMIN_EMAILS && parseEmailList(ADMIN_EMAILS).includes(email)) {
        return AUTHORIZATION_ROLES.ADMIN;
    }
    if(SUPERVISOR_EMAILS && parseEmailList(SUPERVISOR_EMAILS).includes(email)) {
        return AUTHORIZATION_ROLES.SUPERVISOR;
    }
    if(MODERATOR_EMAILS && parseEmailList(MODERATOR_EMAILS).includes(email)) {
        return AUTHORIZATION_ROLES.MODERATOR;
    }
    return AUTHORIZATION_ROLES.USER;
}