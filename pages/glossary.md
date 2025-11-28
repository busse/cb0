---
layout: default
title: Glossary
permalink: /glossary/
---

<main class="page-glossary container">
  <header class="page-header" style="margin-bottom: var(--spacing-xl);">
    <h1 class="page-title">NOTATION GLOSSARY</h1>
    <p class="page-description">This site uses a systematic notation for tracking Ideas, Stories, and Sprints.</p>
  </header>

<div class="glossary-content" markdown="1">

## Notation Formats

| Notation | Meaning | Example |
|----------|---------|---------|
| `i{n}` | Idea n | `i5` = Idea 5 |
| `s{n}` | Story n | `s56` = Story 56 |
| `{idea}.{story}` | Idea + Story (no prefixes) | `5.56` = Idea 5, Story 56 |
| `{sprint}.{idea}.{story}` | Sprint + Idea + Story | `2609.5.56` = Sprint 2609, Idea 5, Story 56 |

## Sprint Format: YYSS

Sprints use a 4-digit format:
- **YY** = 2-digit year (e.g., 26 = 2026)
- **SS** = Sprint number, 01-26
- Each sprint = **2 weeks**

**Examples:**
- `2601` = Year 2026, Sprint 1 (weeks 1-2)
- `2603` = Year 2026, Sprint 3 (weeks 5-6)
- `2609` = Year 2026, Sprint 9 (weeks 17-18)

## Special Cases

### Reserved Values

- **i0** = The site itself (meta-idea documenting the taxonomy)
- **s0** = Intent/purpose story for any idea (why the idea exists)

### Examples

- `i0` = This site
- `i0.s0` = Site intent (why this site exists)
- `i1.s0` = Intent for idea 1
- `2601.0.1` = Update from Sprint 2601 for Idea 0, Story 1

## Taxonomy Hierarchy

```
Ideas (i{n})
  └── Stories (i{n}.s{m})
        └── Updates ({sprint}.{idea}.{story})
              └── Sprints ({YYSS})
```

## Collections

### Ideas
High-level concepts or projects. Each idea has:
- Unique number (0, 1, 2, ...)
- Title and description
- Status (planned, active, completed, archived)
- Related stories

### Stories
Specific tasks or features within an idea. Each story has:
- Parent idea number
- Unique story number (within that idea)
- Status (backlog, planned, in-progress, done)
- Priority (low, medium, high, critical)
- Optional sprint assignment

### Sprints
Two-week time blocks for planning work. Each sprint has:
- Sprint ID in YYSS format
- Start and end dates
- Goals
- Assigned stories

### Updates
Progress entries for specific stories during sprints. Each update has:
- Sprint, idea, and story reference
- Date
- Type (progress, completion, blocker, note)

## Navigation

- [View all ideas](/ideas/) - Browse the ideas array
- [View sprints](/sprints/) - See sprint calendar
- [Homepage](/) - Current sprint and recent updates

## Creating Content

Use the provided Makefile commands:
```bash
make new-idea        # Create new idea
make new-story       # Create new story
make new-sprint      # Create new sprint
```

Or manually create files following the taxonomy structure in `_ideas/`, `_stories/`, `_sprints/`, and `_updates/`.

</div>
</main>