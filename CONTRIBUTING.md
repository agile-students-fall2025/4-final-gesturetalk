# Guide to Contributing

GestureTalk follows Agile and Scrum principles to maintain transparency, accountability, and collaboration.  
All contributors are expected to align with the following values and norms when participating in the project.

---

## Team Values and Norms

GestureTalk follows Agile and Scrum principles to maintain transparency, accountability, and collaboration.  
All contributors are expected to align with the following values and norms when participating in the project.

Our team works primarily through **Discord** and **GitHub**, emphasizing consistent communication, peer review, and short feedback cycles.  
We maintain a flexible remote workflow while ensuring alignment through regular sprint planning and standups.

---

### Team Values

- **Accessibility:** Build inclusively and prioritize usability for all abilities.  
- **Accountability:** Take ownership of assigned tasks and communicate progress or blockers early.  
- **Transparency:** Keep discussions, decisions, and updates visible through GitHub or Discord.  
- **Respect:** Collaborate professionally, give constructive feedback, and assume good intent.  
- **Quality:** Submit clean, reviewed code that adds measurable value to the project.

---

### Collaboration Guidelines

- **Communication:** Use the public Discord channel or GitHub Issues for all project-related updates.  
- **Responsiveness:** Reply to messages or reviews within 24 hours when possible.  
- **Conflict Resolution:** Address disagreements privately first; escalate to the Scrum Master if unresolved.  
- **Decision-Making:** Consensus is preferred, but the Product Owner makes the final call if needed.

---

### Sprint Workflow

- **Sprint cadence:** 2 weeks per sprint.  
- **Standups:** Short daily updates (15-30 minutes) covering progress, next steps, and blockers.  
- **Roles:** Scrum Master and Product Owner rotate each sprint; all members contribute as developers.  
- **Task tracking:** All work is logged as GitHub Issues and linked to milestones.

---

### Coding Standards

- Use **VS Code** as the team’s standard editor for consistency.  
- Keep branches small and short-lived.  
- Use clear, single-line commit messages following `feat:`, `fix:`, or `docs:` conventions.  
- Remove unused or commented-out code before pushing.  
- Each Pull Request must be reviewed by at least one other contributor before merging into `main`.  
- Never commit directly to `main` or include credentials in the repository.


For detailed norms, refer to [TEAM-NORMS.md](https://github.com/nyu-software-engineering/scrum-framework/blob/main/team-norms.md).

---

## Git Workflow
We use the [**Feature Branch Workflow**](https://knowledge.kitchen/content/courses/agile-development-and-devops/slides/feature-branch-workflow/#1) to maintain clean, traceable development.

### Basic Steps

1. **Create a new branch** for each feature, fix, or spike.  
2. **Make and commit changes** locally.
3. **Pull latest updates** from main before pushing.
4. **Push your branch** to the shared team repository (not a fork).
5. **Open a Pull Request (PR)** on GitHub for review.
6. **Request and complete peer review.**
7. **Merge approved PRs** into main.

---

## Contribution Rules
- Follow the [Team Norms & Values](#-team-norms--values) and [Git Workflow](#-git-workflow) outlined above.  
- Write clear, descriptive, single-line commit messages following `feat:`, `fix:`, or `docs:` conventions.  
- Document your code where needed and update any affected documentation or README sections.  
- Assign appropriate GitHub **Issue labels** (`user story`, `task`, `spike`) and **Milestones** for each PR.  
- Do not commit sensitive information such as passwords, API keys, `.env` files, or personal data.  
- Respect the `.gitignore` file: never track dependencies, build artifacts, or environment files.  
- Ensure every PR is reviewed and approved by at least one other contributor before merging into `main`.  
- Keep all branches short-lived and merge whenever possible.  


---

## Local Development Setup

1. **Clone the repository:**
    ```bash
    git clone https://github.com/<org-or-user>/gesturetalk.git
    cd gesturetalk
    ```
2. **Synchronize your git and GitHub usernames:**
    ```bash
    git config --global user.name "<your-github-username>"
    ```
3. **Install dependencies:**
    ```bash
    npm install
    ```
4. **Create a new feature branch:**
    ```bash
    git checkout -b feature/<short-description>
    ```

5. **Start the development server:**
    ```bash
    npm run dev
    ```

**Notes:**
- Requires Node.js ≥ 18.x, npm ≥ 9.x, and MongoDB (local or Atlas).
- A webcam is needed for gesture recognition testing.

---

## Building and Testing

Working in progress. To be updated.


---


*Last upaded: October 2025 *