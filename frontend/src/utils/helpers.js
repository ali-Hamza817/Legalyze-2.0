// Helper functions

// Format date to readable string
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Format file size
export const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Smooth scroll to section
export const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// Validate email
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
export const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};

// Mock document download
export const downloadDocument = (documentName) => {
    // In a real app, this would trigger actual download
    console.log(`Downloading document: ${documentName}`);
    alert(`Document "${documentName}" download started!`);
};

// Generate unique ID
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
