import logging
from datetime import datetime, timezone, timedelta
from app.core.database import get_database
from app.core.security import hash_password

logger = logging.getLogger(__name__)

SEEDED_TEMPLATES = [
    # DEVELOPER PERSONA
    {"title": "Production API Endpoint Architect", "persona": "Developer", "tags": ["code", "api", "backend"], "variables": ["framework", "database", "resource"], "content": "Act as a Principal Backend Systems Architect. Design a production-grade RESTful API endpoint for {{resource}} using {{framework}} and {{database}}. Include strict Pydantic/TypeScript validation schemas, JWT authentication middleware, idempotency handling, comprehensive error mapping, and OpenAPI annotations."},
    {"title": "Unit Test Suite Generator", "persona": "Developer", "tags": ["code", "testing", "pytest"], "variables": ["language", "target_function"], "content": "Act as a Senior QA Automation Engineer. Write a comprehensive unit test suite in {{language}} for {{target_function}}. Include happy path, boundary edge cases, null/invalid payload assertions, mocking for external calls, and benchmark performance assertions."},
    {"title": "Full-Stack System Architecture Design", "persona": "Developer", "tags": ["architecture", "scaling"], "variables": ["system_name", "scale"], "content": "Act as a Chief Technology Officer. Design a high-availability distributed architecture for {{system_name}} serving {{scale}} daily active users. Provide an ASCII architecture diagram, database sharding strategy, Redis caching layers, message queues, and disaster recovery plan."},
    {"title": "Regex & Parser Construction", "persona": "Developer", "tags": ["regex", "parsing"], "variables": ["pattern_description", "language"], "content": "Construct an optimal, non-catastrophic-backtracking regular expression in {{language}} that matches: {{pattern_description}}. Explain each capture group, provide 5 positive and 5 negative test cases, and analyze time complexity."},
    {"title": "SQL Query Optimization & Indexing", "persona": "Developer", "tags": ["sql", "database", "performance"], "variables": ["query", "engine"], "content": "Analyze the following {{engine}} query: {{query}}. Identify full table scans, suggest compound B-Tree indexes, rewrite using CTEs/window functions for minimal disk I/O, and explain the estimated EXPLAIN ANALYZE difference."},
    {"title": "Docker Multi-Stage Production Build", "persona": "Developer", "tags": ["devops", "docker"], "variables": ["stack"], "content": "Write an enterprise-grade multi-stage Dockerfile for {{stack}}. Optimize layer caching, enforce a non-root unprivileged user, eliminate dev dependencies from final image, and configure healthcheck probes."},

    # STUDENT PERSONA
    {"title": "Feynman Technique Concept Explainer", "persona": "Student", "tags": ["learning", "concept"], "variables": ["topic", "target_level"], "content": "Explain {{topic}} using the Feynman Technique. Break it down using simple real-world analogies suitable for {{target_level}}, eliminate confusing jargon, highlight the 3 most common misconceptions, and formulate 3 self-test questions."},
    {"title": "Active Recall Study Guide & Flashcards", "persona": "Student", "tags": ["study", "flashcards"], "variables": ["subject", "exam"], "content": "Create an active recall study curriculum for {{subject}} preparing for {{exam}}. Group concepts into high-yield priority tiers, generate 10 Q&A flashcards with spaced repetition intervals, and summarize key formulas."},
    {"title": "Step-by-Step Mathematical Derivation", "persona": "Student", "tags": ["math", "derivation"], "variables": ["equation_or_theorem"], "content": "Provide a rigorous, step-by-step proof and derivation of {{equation_or_theorem}}. Annotate every single algebraic manipulation with the mathematical principle used, and visualize the geometric or physical interpretation."},
    {"title": "Essay Thesis & Argument Matrix", "persona": "Student", "tags": ["writing", "essay"], "variables": ["prompt_topic"], "content": "Develop a compelling academic thesis statement on {{prompt_topic}}. Provide 3 supporting body arguments with theoretical evidence, 1 major counter-argument, and a decisive rebuttal structure."},
    {"title": "Code Walkthrough for Beginners", "persona": "Student", "tags": ["programming", "beginners"], "variables": ["algorithm"], "content": "Explain the {{algorithm}} algorithm line by line. Walk through an execution trace with sample array inputs, draw step-by-step state diagrams, and discuss why the Big-O time and space complexity matters."},

    # WRITER PERSONA
    {"title": "High-Converting Landing Page Copy", "persona": "Writer", "tags": ["marketing", "copywriting"], "variables": ["product", "target_customer"], "content": "Act as a World-Class Conversion Copywriter. Write high-converting landing page copy for {{product}} targeting {{target_customer}}. Structure using the PAS (Problem-Agitate-Solve) framework: irresistible H1 hero headline, benefit-driven subheads, social proof bullets, and compelling CTA buttons."},
    {"title": "Viral Hook & Twitter/LinkedIn Thread", "persona": "Writer", "tags": ["social", "growth"], "variables": ["core_lesson"], "content": "Draft a high-engagement 7-post thread on {{core_lesson}}. Craft 3 hook variations using tension and curiosity gaps. Provide punchy 1-2 sentence insights, real-world case evidence, and a memorable concluding takeaway."},
    {"title": "Sensory Fiction Scene Construction", "persona": "Writer", "tags": ["fiction", "creative"], "variables": ["scene_setting", "protagonist_emotion"], "content": "Write a gripping fiction scene set in {{scene_setting}} where the protagonist experiences intense {{protagonist_emotion}}. Incorporate all five senses, utilize subtext in dialogue, avoid cliché metaphors, and vary sentence cadences for dramatic tension."},
    {"title": "Authoritative Thought Leadership Op-Ed", "persona": "Writer", "tags": ["journalism", "op-ed"], "variables": ["industry_trend"], "content": "Write a provocative, well-researched op-ed on {{industry_trend}}. Open with an arresting counter-intuitive hook, dismantle the prevailing industry consensus with data points, and outline a forward-looking paradigm shift."},
    {"title": "Executive Newsletter Issue", "persona": "Writer", "tags": ["newsletter", "curation"], "variables": ["weekly_theme"], "content": "Compose an issue of a premium curated newsletter focused on {{weekly_theme}}. Include an editorial essay of 250 words, 3 curated industry developments with strategic analysis, and 1 actionable tactical prompt."},

    # RESEARCHER PERSONA
    {"title": "Systematic Literature Review Protocol", "persona": "Researcher", "tags": ["academic", "research"], "variables": ["research_question", "domain"], "content": "Act as a Senior Research Fellow in {{domain}}. Formulate a systematic review protocol for: '{{research_question}}'. Define PRISMA inclusion/exclusion criteria, exact Boolean search strings for PubMed/IEEE, and a methodological bias assessment framework."},
    {"title": "Peer-Review Critique & Weakness Audit", "persona": "Researcher", "tags": ["peer-review", "methodology"], "variables": ["methodology_summary"], "content": "Act as a tough Reviewer #2 for a top-tier journal. Critically examine the following methodology: {{methodology_summary}}. Identify unaddressed confounding variables, sample size power limitations, validity threats, and request specific sensitivity analyses."},
    {"title": "Statistical Analysis Plan", "persona": "Researcher", "tags": ["statistics", "data"], "variables": ["hypotheses", "data_type"], "content": "Construct an end-to-end Statistical Analysis Plan (SAP) to test {{hypotheses}} on {{data_type}}. Specify parametric vs non-parametric tests, correction for multiple comparisons (Bonferroni/FDR), and effect size calculation formulas."},
    {"title": "Comparative Meta-Analysis Matrix", "persona": "Researcher", "tags": ["meta-analysis"], "variables": ["technologies_or_treatments"], "content": "Create a side-by-side comparative evaluation matrix contrasting {{technologies_or_treatments}}. Compare on efficacy, compute cost, failure modes, scalability limits, and synthesis of recent empirical benchmarks."},

    # BUSINESS PERSONA
    {"title": "Executive Board Memo (Amazon-style 1-Pager)", "persona": "Business", "tags": ["strategy", "executive"], "variables": ["initiative", "budget_ask"], "content": "Act as a VP of Strategy. Write a crisp 1-page executive decision memo requesting {{budget_ask}} for {{initiative}}. State the strategic imperative, quantified ROI, customer impact, top 3 execution risks, and day-90 milestones."},
    {"title": "Competitive Moat & SWOT Disruption Analysis", "persona": "Business", "tags": ["strategy", "competition"], "variables": ["company", "competitor"], "content": "Perform a rigorous competitive moat assessment comparing {{company}} against {{competitor}}. Evaluate network effects, switching costs, cost advantages, and systemic vulnerabilities over a 3-year horizon."},
    {"title": "Customer Discovery Interview Script", "persona": "Business", "tags": ["product", "interviews"], "variables": ["persona", "pain_point"], "content": "Design a 15-question customer discovery interview guide based on 'The Mom Test' principles for {{persona}} experiencing {{pain_point}}. Craft open-ended questions that uncover past behaviors and real budget commitments without leading the witness."},
    {"title": "SaaS Unit Economics & Pricing Model", "persona": "Business", "tags": ["finance", "saas"], "variables": ["product_type", "acv"], "content": "Model the unit economics for a {{product_type}} SaaS with ${{acv}} target ACV. Provide LTV:CAC targets, payback period benchmarks, gross margin requirements, and a 3-tier value-metric pricing strategy."},
    {"title": "Post-Mortem Root Cause Analysis (5 Whys)", "persona": "Business", "tags": ["operations", "incident"], "variables": ["incident_summary"], "content": "Conduct a blameless post-mortem for {{incident_summary}}. Apply the 5-Whys methodology to trace systemic organizational and technical root causes, and propose P0/P1 corrective preventive actions with ownership assignments."},

    # GENERAL & CREATIVE
    {"title": "Socratic Debate & Devil's Advocate", "persona": "General", "tags": ["debate", "critical-thinking"], "variables": ["topic"], "content": "Act as an intellectual sparring partner using the Socratic method on {{topic}}. Challenge my initial premise with sharp counter-examples, uncover hidden assumptions, and force me to defend my reasoning with first principles."},
    {"title": "Complex Decision Matrix (Weighted Scoring)", "persona": "General", "tags": ["decision-making"], "variables": ["options", "criteria"], "content": "Build a weighted multi-criteria decision matrix to choose between {{options}} based on {{criteria}}. Assign weights (1-10), rate each option with written rationales, and test sensitivity to changing priorities."},
    {"title": "Crisp Executive Summary from Raw Notes", "persona": "General", "tags": ["summary", "notes"], "variables": ["raw_notes"], "content": "Condense the following disorganized notes: {{raw_notes}}. Extract the 3 core decisions made, list all action items with clear owners, and highlight open unresolved questions."},
    {"title": "Cross-Disciplinary Analogy Generator", "persona": "General", "tags": ["creativity", "analogies"], "variables": ["abstract_concept", "target_field"], "content": "Explain the concept of {{abstract_concept}} through a detailed, multi-layered analogy drawn entirely from {{target_field}}. Map each sub-component directly and explain where the analogy breaks down."},
    {"title": "Comprehensive Travel Itinerary Architect", "persona": "General", "tags": ["travel", "planning"], "variables": ["destination", "days", "style"], "content": "Design an optimized day-by-day itinerary for {{days}} days in {{destination}} for a {{style}} traveler. Cluster attractions geographically to minimize transit, include authentic local dining recommendations, and specify optimal visiting hours to avoid crowds."}
]

async def seed_initial_data():
    db = get_database()

    # 1. Seed demo user if not existing
    demo_email = "demo@optimind.ai"
    existing_user = await db.users.find_one({"email": demo_email})
    if not existing_user:
        demo_user_doc = {
            "email": demo_email,
            "password_hash": hash_password("password123"),
            "name": "Alex Mercer",
            "avatar": None,
            "language": "en",
            "timezone": "UTC",
            "persona": "Developer",
            "theme": "dark",
            "settings": {
                "auto_optimize": False,
                "preferred_optimization_mode": "Balanced",
                "tone_slider": 50,
                "detail_slider": 60,
                "expertise_slider": 75,
                "dyslexia_font": False,
                "reduced_motion": False,
                "high_contrast": False,
                "font_size": "medium",
                "notifications_push": True,
                "notifications_email": True,
                "reminder_time": "19:00",
                "last_chance_enabled": True
            },
            "xp": 350,
            "level": 3,
            "created_at": datetime.now(timezone.utc) - timedelta(days=6),
            "updated_at": datetime.now(timezone.utc)
        }
        res = await db.users.insert_one(demo_user_doc)
        demo_user_id = str(res.inserted_id)

        # Initialize demo streak (e.g. 5 days active)
        await db.streaks.insert_one({
            "user_id": demo_user_id,
            "current": 5,
            "longest": 5,
            "last_qualified_date": (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d"),
            "freezes": 2,
            "created_at": datetime.now(timezone.utc) - timedelta(days=6),
            "updated_at": datetime.now(timezone.utc)
        })

        # Seed sample chat
        chat_doc = {
            "user_id": demo_user_id,
            "title": "FastAPI & Microservices Architecture",
            "pinned": True,
            "model": "gemini-1.5-flash",
            "created_at": datetime.now(timezone.utc) - timedelta(days=1),
            "updated_at": datetime.now(timezone.utc) - timedelta(days=1)
        }
        chat_res = await db.chats.insert_one(chat_doc)
        chat_id = str(chat_res.inserted_id)

        # Seed messages in chat
        await db.messages.insert_many([
            {
                "chat_id": chat_id,
                "user_id": demo_user_id,
                "role": "user",
                "content": "Design an async FastAPI microservice architecture with Redis queue and MongoDB storage.",
                "tokens": 40,
                "created_at": datetime.now(timezone.utc) - timedelta(days=1)
            },
            {
                "chat_id": chat_id,
                "user_id": demo_user_id,
                "role": "assistant",
                "content": "### Production FastAPI Microservices Architecture\n\nHere is an enterprise-grade async architecture:\n\n1. **API Gateway**: Traefik with TLS termination.\n2. **App Layer**: FastAPI with Uvicorn workers and Pydantic v2 schemas.\n3. **Queue**: Redis Stream / Celery workers for async background processing.\n4. **Database**: MongoDB with Motor async driver and replica set.\n\n```python\n# Async task dispatcher\nfrom fastapi import FastAPI, BackgroundTasks\napp = FastAPI()\n```",
                "tokens": 120,
                "created_at": datetime.now(timezone.utc) - timedelta(days=1)
            }
        ])

        # Seed initial memories
        await db.memories.insert_many([
            {
                "user_id": demo_user_id,
                "text": "Prefers Python and TypeScript for modern stack examples.",
                "category": "preference",
                "enabled": True,
                "created_at": datetime.now(timezone.utc)
            },
            {
                "user_id": demo_user_id,
                "text": "Avoids verbose corporate fluff; desires direct technical schemas and code.",
                "category": "tone",
                "enabled": True,
                "created_at": datetime.now(timezone.utc)
            }
        ])
        logger.info("Demo user 'demo@optimind.ai' created successfully.")

    # 2. Seed Templates (30+ templates)
    existing_template_count = await db.templates.count_documents({"user_id": None})
    if existing_template_count == 0:
        docs = []
        for t in SEEDED_TEMPLATES:
            docs.append({
                "user_id": None, # System template
                "title": t["title"],
                "description": f"Optimized prompt template for {t['persona']} workflows.",
                "content": t["content"],
                "tags": t["tags"],
                "persona": t["persona"],
                "variables": t["variables"],
                "is_public": True,
                "upvotes": 12,
                "uses_count": 45,
                "created_at": datetime.now(timezone.utc)
            })
        await db.templates.insert_many(docs)
        logger.info("Seeded %d system prompt templates.", len(docs))

