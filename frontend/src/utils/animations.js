// Animation variants for Framer Motion
export const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.6 }
    }
};

export const slideInFromLeft = {
    hidden: { x: -100, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeOut' }
    }
};

export const slideInFromRight = {
    hidden: { x: 100, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeOut' }
    }
};

export const slideInFromBottom = {
    hidden: { y: 100, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeOut' }
    }
};

export const scaleIn = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.5, ease: 'easeOut' }
    }
};

export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

export const hoverScale = {
    scale: 1.05,
    transition: { duration: 0.3 }
};

export const tapScale = {
    scale: 0.95
};

export const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4 }
};
