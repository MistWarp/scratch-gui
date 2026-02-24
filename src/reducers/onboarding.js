const SHOW_ONBOARDING = 'scratch-gui/onboarding/SHOW_ONBOARDING';
const HIDE_ONBOARDING = 'scratch-gui/onboarding/HIDE_ONBOARDING';
const NEXT_ONBOARDING_STEP = 'scratch-gui/onboarding/NEXT_ONBOARDING_STEP';
const PREV_ONBOARDING_STEP = 'scratch-gui/onboarding/PREV_ONBOARDING_STEP';
const SKIP_ONBOARDING = 'scratch-gui/onboarding/SKIP_ONBOARDING';

const initialState = {
    visible: false,
    step: 0
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SHOW_ONBOARDING:
        return Object.assign({}, state, {
            visible: true,
            step: 0
        });
    case HIDE_ONBOARDING:
        return Object.assign({}, state, {
            visible: false,
            step: 0
        });
    case NEXT_ONBOARDING_STEP:
        return Object.assign({}, state, {
            step: state.step + 1
        });
    case PREV_ONBOARDING_STEP:
        if (state.step > 0) {
            return Object.assign({}, state, {
                step: state.step - 1
            });
        }
        return state;
    case SKIP_ONBOARDING:
        return Object.assign({}, state, {
            visible: false,
            step: 0
        });
    default:
        return state;
    }
};

const showOnboarding = function () {
    return {
        type: SHOW_ONBOARDING
    };
};

const hideOnboarding = function () {
    return {
        type: HIDE_ONBOARDING
    };
};

const nextOnboardingStep = function () {
    return {
        type: NEXT_ONBOARDING_STEP
    };
};

const prevOnboardingStep = function () {
    return {
        type: PREV_ONBOARDING_STEP
    };
};

const skipOnboarding = function () {
    return {
        type: SKIP_ONBOARDING
    };
};

export {
    reducer as default,
    initialState as onboardingInitialState,
    showOnboarding,
    hideOnboarding,
    nextOnboardingStep,
    prevOnboardingStep,
    skipOnboarding
};
