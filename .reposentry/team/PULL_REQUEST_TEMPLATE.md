```markdown
# Pull Request Template

## Description

Please include a summary of the changes and related context. Explain the **why** behind these changes.

- What problem does this PR solve?
- What feature does it add?
- Any breaking changes?

## Type of Change

Please select the relevant option:

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 🔧 Refactor (code restructuring without changing behavior)
- [ ] 📚 Documentation (updates to docs, README, or comments)
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security fix
- [ ] 🧪 Test addition or update
- [ ] 🚀 Infrastructure/CI-CD change
- [ ] ⚙️ Dependencies update
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to change)

## Checklist

### Code Quality
- [ ] My code follows the TypeScript/JavaScript style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation

### Testing & Types
- [ ] I have updated or added tests for my changes
- [ ] All new and existing tests pass locally (`npm run test`)
- [ ] I have run TypeScript type checking (`npm run typecheck`)
- [ ] Type safety has been maintained (no new `any` types introduced)

### Build & Integration
- [ ] The build succeeds (`npm run build`)
- [ ] No new console warnings or errors
- [ ] Changes work with both CommonJS and ES modules (where applicable)

### Git & Commit
- [ ] My branch is up to date with the base branch
- [ ] My commit messages are clear and follow conventions
- [ ] I have not included unrelated changes in this PR

### RepoSentry-Specific (if applicable)
- [ ] If modifying engines, I've tested analysis output
- [ ] If modifying prompts, I've validated the generated content
- [ ] If modifying scanners, I've tested with different project types
- [ ] If modifying CLI, I've tested all affected commands
- [ ] If adding features, I've updated relevant config and documentation

## Screenshots / Demos

If this PR includes UI changes, terminal output changes, or new visual elements:

<!-- Add screenshots or GIFs here -->

**Before:**
<!-- Screenshot or description -->

**After:**
<!-- Screenshot or description -->

## Performance Impact

- [ ] No performance changes
- [ ] Performance improved (describe improvements)
- [ ] Performance slightly reduced (explain reasoning and necessity)

## Related Issues

Closes: #<!-- issue number -->

**Related PRs:** <!-- if any -->

## Deployment Notes

Any special instructions for deployment or environment setup?

<!-- Add deployment notes here, or delete this section if not applicable -->

## Additional Context

Add any other context about the PR here (assumptions, edge cases, known limitations, etc.).

---

**Thank you for contributing to RepoSentry!** 🚀
```