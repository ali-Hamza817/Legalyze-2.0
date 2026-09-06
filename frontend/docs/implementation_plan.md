# Implementation Plan - Global Theme Support & Fixes

## Goal Description
Fix the visibility of Navbar text in Light Mode on the Landing Page and extend the Light/Dark mode functionality (including the toggle button) to all other pages (`SignIn`, `SignUp`, `ChatInterface`, `DocumentForm`).

## User Review Required
> [!NOTE]
> No critical breaking changes. This is an enhancement to the existing theme implementation.

## Proposed Changes

### Landing Page
#### [MODIFY] [LandingPage.jsx](file:///e:/Masters%20in%20Software%20Engineering%20(MSSE%2032)%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze 2.0/frontend/src/pages/LandingPage.jsx)
- **Navbar Text:** Update the `color` prop or `sx` style of the Navbar buttons ("Home", "About Us", etc.) to use `text.primary` or a conditional color based on the mode, ensuring visibility against the white background in Light Mode.

### Authentication Pages
#### [MODIFY] [SignIn.jsx](file:///e:/Masters%20in%20Software%20Engineering%20(MSSE%2032)%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze 2.0/frontend/src/pages/SignIn.jsx)
- Add the `Brightness4`/`Brightness7` icon button for toggling the theme, likely in the top-right corner or near the "Back to Home" button.

#### [MODIFY] [SignUp.jsx](file:///e:/Masters%20in%20Software%20Engineering%20(MSSE%2032)%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze 2.0/frontend/src/pages/SignUp.jsx)
- Add the theme toggle button.

### Application Pages
#### [MODIFY] [ChatInterface.jsx](file:///e:/Masters%20in%20Software%20Engineering%20(MSSE%2032)%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze 2.0/frontend/src/pages/ChatInterface.jsx)
- Integrate `useColorMode` and `useTheme`.
- Replace hardcoded background colors with theme values.
- Add the theme toggle button to the header/navbar area.

#### [MODIFY] [DocumentForm.jsx](file:///e:/Masters%20in%20Software%20Engineering%20(MSSE%2032)%20at%20Military%20College%20of%20Signals/Agentic%20AI/Legalyze 2.0/frontend/src/pages/DocumentForm.jsx)
- Integrate `useColorMode` and `useTheme`.
- Replace hardcoded background colors with theme values.
- Add the theme toggle button.

## Verification Plan
### Manual Verification
1.  **Landing Page:**
    - Toggle to Light Mode.
    - Verify "Home", "About Us", etc., are visible (dark text).
    - Toggle back to Dark Mode.
    - Verify text is visible (white/light text).
2.  **Other Pages (SignIn, SignUp, Chat, DocumentForm):**
    - Navigate to each page.
    - Verify the Theme Toggle button is present.
    - Toggle the theme.
    - Verify the background and text colors update correctly and remain legible.
