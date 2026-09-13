# Prompt Journal — Sprint 1

**Student:** Lim Chuosrun  
**ID:** 2024588  
**Project:** Cambodian Silk Archives

> **Note:** The original chat transcript was not available, so the prompts below are careful reconstructions from the work completed during each session. They should be replaced with the exact sent wording if the chat history is recovered.

## Friday's Lab

**1. Prompt that mattered most**

> I am building a Cambodian Silk Archives website in Next.js with VS Code. Please help me plan the deployment process for this existing project, including what files and settings need to be checked before deploying to Vercel and what permissions I will need for GitHub and Vercel. Do not deploy or push anything without asking for my permission first. Give me the steps in order and explain what I should verify after each step.

**2. Technique**

Contextual prompting, with a metaprompt for a step-by-step output format.

**3. What came back**

The AI explained the deployment sequence and helped connect the project to GitHub and Vercel, while identifying the permissions required for those actions.

**4. What I changed or rejected**

I kept the plan-mode workflow because it made the process understandable, but I did not accept autonomous deployment or repository changes without reviewing and approving each permission request. The first local browser check showed a hydration warning, which I treated as an extension/browser issue and retested in an incognito window before accepting the result.

## Weekend Session

**1. Prompt that mattered most**

> Act as a frontend developer and help me build the Cambodian Silk Archives interface in the existing Next.js project. Work only in the files needed for the page, entry cards, archive data, and global styles. The site should present the lifecycle of Cambodian golden silk as a browsable archive with a search field, entry cards, detail pages, responsive layouts, readable typography, and the existing project structure. Do not add new packages. Before changing files, describe the plan; after changing them, summarize what I should test.

**2. Technique**

Role prompting plus contextual prompting.

**3. What came back**

The AI produced a working archive interface with lifecycle entries, images, search behavior, responsive styling, and detail-page navigation within the existing Next.js structure.

**4. What I changed or rejected**

I kept the archive structure and the warm museum-style direction, but I rejected or revised parts of the generated presentation when the font, theme, frame, spacing, or overall UX did not match the project. I tested those changes in the browser instead of assuming that a successful build meant the design was finished.

## Next Week's Fixes

**1. Prompt that mattered most**

> Review the current Cambodian Silk Archives page as a frontend code reviewer. Focus only on the visible problems I list: fix the spacing around the search and archive content, correct any gibberish or incorrect text in the search area, and keep the existing search behavior and project structure. Touch only the files needed for these fixes. After editing, tell me exactly what changed and what I should check in the browser. If a requested change is ambiguous, ask one question before editing.

**2. Technique**

Role prompting with a constrained refinement prompt.

**3. What came back**

The AI identified and corrected the spacing issue and the broken or gibberish search-bar text without changing the archive's underlying data or search logic.

**4. What I changed or rejected**

I accepted the targeted text and spacing fixes after checking the page visually, but I rejected broader styling changes when the result did not match what I expected. This was a useful reminder to refine one change at a time instead of asking for several unrelated improvements in one prompt.

## Reflection

The most useful pattern this sprint was giving the AI the actual project context and a narrow boundary for the files and behavior it could change. The weaker prompts were the ones that described a visual result too generally; when the output missed the intended UX, I had to restate the constraint and test smaller changes. I used VS Code's auto agent, with DeepSeek V4 Flash, throughout this work and would keep it for this sprint while comparing it with Cline in a later sprint.
