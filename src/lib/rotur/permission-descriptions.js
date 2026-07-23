const PERMISSION_DESCRIPTIONS = {
    'account:view': 'See your account details',
    'account:profile': 'Update your presence and profile',
    'account:settings': 'Change your account settings',
    'credits:view': 'See your credit balance and transactions',
    'credits:transfer': 'Send your credits to other users',
    'credits:daily': 'Claim your daily credits',
    'credits:manage': 'Manage your credits',
    'keys:view': 'See the keys you own',
    'keys:manage': 'Create and manage your keys',
    'following:follow': 'Follow users on your behalf',
    'following:unfollow': 'Unfollow users on your behalf',
    'friends:view': 'See your friends list',
    'friends:request': 'Send friend requests',
    'friends:accept': 'Accept friend requests',
    'friends:remove': 'Remove friends',
    'posts:view': 'See posts you can access',
    'posts:create': 'Create posts as you',
    'posts:like': 'Like posts on your behalf',
    'posts:reply': 'Reply to posts as you'
};

// Group label per category (the part before the colon).
const CATEGORY_LABELS = {
    account: 'Account',
    credits: 'Economy',
    keys: 'Keys',
    following: 'Following',
    friends: 'Friends',
    posts: 'Social',
    status: 'Status'
};

// Never grantable through this flow (mirrors rotur.dev FORBIDDEN_PERMISSIONS).
const FORBIDDEN_PERMISSIONS = new Set(['tokens:manage', 'account:delete']);

const titleCase = word => word.charAt(0).toUpperCase() + word.slice(1);

const describePermission = scope => {
    if (PERMISSION_DESCRIPTIONS[scope]) {
        return PERMISSION_DESCRIPTIONS[scope];
    }
    const [category, action] = scope.split(':');
    return `${titleCase(action || 'use')} your ${category}`;
};

const categoryOf = scope => scope.split(':')[0];

const categoryLabel = scope => CATEGORY_LABELS[categoryOf(scope)] || titleCase(categoryOf(scope));

export {
    PERMISSION_DESCRIPTIONS,
    FORBIDDEN_PERMISSIONS,
    describePermission,
    categoryOf,
    categoryLabel
};
