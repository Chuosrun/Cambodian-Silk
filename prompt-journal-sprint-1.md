# Prompt Journal — Sprint 1

**Student:** Lim Chuosrun  
**ID:** 2024588  
**Project:** Cambodian Silk Archives

## Friday's Lab

### 1. Prompt That Mattered Most

> I am building a Cambodian Silk Archives website in Next.js with VS Code. Please help me plan the deployment process for this existing project, including what files and settings need to be checked before deploying to Vercel and what permissions I will need for GitHub and Vercel. Do not deploy or push anything without asking for my permission first. Give me the steps in order and explain what I should verify after each step.

### 2. Technique

Contextual prompting with a metaprompt for a step-by-step output format.

### 3. What Came Back

The AI explained the deployment sequence and helped connect the project to GitHub and Vercel, while identifying the permissions required for those actions.

### 4. What I Changed or Rejected

I kept the plan-mode workflow because it made the process understandable, but I did not accept autonomous deployment or repository changes without reviewing and approving each permission request. The first local browser check showed a hydration warning, which I treated as an extension/browser issue and retested in an incognito window before accepting the result.

## Weekend Session

### 1. Prompt That Mattered Most

> Act as a frontend developer and help me build the Cambodian Silk Archives interface in the existing Next.js project. Work only in the files needed for the page, entry cards, archive data, and global styles. The site should present the lifecycle of Cambodian golden silk as a browsable archive with a search field, entry cards, detail pages, responsive layouts, readable typography, and the existing project structure. Do not add new packages. Before changing files, describe the plan; after changing them, summarize what I should test.

### 2. Technique

Role prompting plus contextual prompting.

### 3. What Came Back

The AI produced a working archive interface with lifecycle entries, images, search behavior, responsive styling, and detail-page navigation within the existing Next.js structure.

### 4. What I Changed or Rejected

I kept the archive structure and the warm museum-style direction, but I rejected or revised parts of the generated presentation when the font, theme, frame, spacing, or overall UX did not match the project. I tested those changes in the browser instead of assuming that a successful build meant the design was finished.

## Next Week's Fixes

### 1. Prompt That Mattered Most

> Review the current Cambodian Silk Archives page as a frontend code reviewer. Focus only on the visible problems I list: fix the spacing around the search and archive content, correct any gibberish or incorrect text in the search area, and keep the existing search behavior and project structure. Touch only the files needed for these fixes. After editing, tell me exactly what changed and what I should check in the browser. If a requested change is ambiguous, ask one question before editing.

### 2. Technique

Role prompting with a constrained refinement prompt.

### 3. What Came Back

The AI identified and corrected the spacing issue and the broken or gibberish search-bar text without changing the archive's underlying data or search logic.

### 4. What I Changed or Rejected

I accepted the targeted text and spacing fixes after checking the page visually, but I rejected broader styling changes when the result did not match what I expected. This was a useful reminder to refine one change at a time instead of asking for several unrelated improvements in one prompt.

## Reflection

### What did you build?

I built a Cambodian Silk Archives website in Next.js with eight entries about the lifecycle and production of Cambodian golden silk. Visitors can browse the entries, open individual detail pages, and search the archive in both English and Khmer. I gathered the images and archive data myself from actual places connected to the silk process, including Koh Oknha Tei, Koh Dach, and farms along the Mekong.

### What did you learn?

I learned that AI works better when I provide the real project context, limit the files it can change, and ask for a clear process before implementation. I also learned that AI can help with deployment and GitHub tasks, but it still needs my permission and review. A hydration warning appeared during testing, and I discovered that it was related to the extension environment by checking the site in an incognito window. I used VS Code's auto agent with DeepSeek V4 Flash during this sprint.

### What changes in Sprint 2?

In Sprint 2, I will keep recording useful prompts while I work instead of trying to reconstruct them later. I will also improve the source notes for the field photographs and archive data, test more deliberately on mobile devices, and compare Cline with the VS Code auto agent. I will continue using small commits with clear AI-assisted labels when AI contributes to the change.
