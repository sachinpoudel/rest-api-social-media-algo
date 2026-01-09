export const AUTHORIZATION_ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    SUPERVISOR: 'supervisor',
    MODERATOR: 'moderator',
    CLIENT: 'client',
    GUIDE: 'guide'
} as const;

export const GENDER_OPTIONS = ['male', 'female', 'other'] as const;

export const USER_AWARD_OPTIONS = ['bronze', 'silver', 'gold'] as const;

export const USER_PLAN_OPTIONS = ['free', 'premium', 'pro'] as const;

export const STATUS_OPTIONS = ['pending', 'active'] as const;