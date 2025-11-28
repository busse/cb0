.PHONY: serve build clean install new-idea new-story new-sprint help

help:
	@echo "Jekyll Ideas Taxonomy - Available Commands"
	@echo ""
	@echo "  make install      Install dependencies (bundle install)"
	@echo "  make serve        Start local dev server with live reload"
	@echo "  make build        Production build (JEKYLL_ENV=production)"
	@echo "  make clean        Clean Jekyll build artifacts"
	@echo ""
	@echo "  make new-idea     Create a new idea"
	@echo "  make new-story    Create a new story"
	@echo "  make new-sprint   Create a new sprint"
	@echo ""

install:
	bundle install

serve:
	bundle exec jekyll serve --livereload --drafts

build:
	JEKYLL_ENV=production bundle exec jekyll build

clean:
	bundle exec jekyll clean

new-idea:
	@echo "Creating new idea..."
	@read -p "Idea number: " num; \
	if [ -f "_ideas/$$num.md" ]; then \
		echo "Error: Idea $$num already exists!"; \
		exit 1; \
	fi; \
	echo "---" > _ideas/$$num.md; \
	echo "layout: idea" >> _ideas/$$num.md; \
	echo "idea_number: $$num" >> _ideas/$$num.md; \
	echo "title: \"\"" >> _ideas/$$num.md; \
	echo "description: \"\"" >> _ideas/$$num.md; \
	echo "status: planned" >> _ideas/$$num.md; \
	echo "created: $$(date +%Y-%m-%d)" >> _ideas/$$num.md; \
	echo "tags: []" >> _ideas/$$num.md; \
	echo "---" >> _ideas/$$num.md; \
	echo "" >> _ideas/$$num.md; \
	echo "Idea content goes here..." >> _ideas/$$num.md; \
	mkdir -p _stories/$$num; \
	echo "✓ Created _ideas/$$num.md"; \
	echo "✓ Created _stories/$$num/ directory"; \
	echo ""; \
	echo "Next: Edit _ideas/$$num.md to add title and description"

new-story:
	@echo "Creating new story..."
	@read -p "Idea number: " idea; \
	if [ ! -d "_stories/$$idea" ]; then \
		echo "Error: Idea $$idea doesn't exist! Create the idea first."; \
		exit 1; \
	fi; \
	read -p "Story number: " story; \
	if [ -f "_stories/$$idea/$$story.md" ]; then \
		echo "Error: Story $$idea.$$story already exists!"; \
		exit 1; \
	fi; \
	echo "---" > _stories/$$idea/$$story.md; \
	echo "layout: story" >> _stories/$$idea/$$story.md; \
	echo "idea_number: $$idea" >> _stories/$$idea/$$story.md; \
	echo "story_number: $$story" >> _stories/$$idea/$$story.md; \
	echo "title: \"\"" >> _stories/$$idea/$$story.md; \
	echo "description: \"\"" >> _stories/$$idea/$$story.md; \
	echo "status: backlog" >> _stories/$$idea/$$story.md; \
	echo "priority: medium" >> _stories/$$idea/$$story.md; \
	echo "created: $$(date +%Y-%m-%d)" >> _stories/$$idea/$$story.md; \
	echo "---" >> _stories/$$idea/$$story.md; \
	echo "" >> _stories/$$idea/$$story.md; \
	echo "Story details and acceptance criteria..." >> _stories/$$idea/$$story.md; \
	echo "✓ Created _stories/$$idea/$$story.md"; \
	echo ""; \
	echo "Next: Edit the file to add title, description, and acceptance criteria"

new-sprint:
	@echo "Creating new sprint..."
	@read -p "Sprint ID (YYSS format, e.g. 2609): " id; \
	if [ -f "_sprints/$$id.md" ]; then \
		echo "Error: Sprint $$id already exists!"; \
		exit 1; \
	fi; \
	yy=$${id:0:2}; \
	ss=$${id:2:2}; \
	echo "---" > _sprints/$$id.md; \
	echo "layout: sprint" >> _sprints/$$id.md; \
	echo "sprint_id: $$id" >> _sprints/$$id.md; \
	echo "year: 20$$yy" >> _sprints/$$id.md; \
	echo "sprint_number: $$ss" >> _sprints/$$id.md; \
	echo "start_date: " >> _sprints/$$id.md; \
	echo "end_date: " >> _sprints/$$id.md; \
	echo "status: planned" >> _sprints/$$id.md; \
	echo "goals: []" >> _sprints/$$id.md; \
	echo "---" >> _sprints/$$id.md; \
	echo "" >> _sprints/$$id.md; \
	echo "Sprint notes and retrospective..." >> _sprints/$$id.md; \
	echo "✓ Created _sprints/$$id.md"; \
	echo ""; \
	echo "Next: Edit the file to add start_date, end_date, and goals"

