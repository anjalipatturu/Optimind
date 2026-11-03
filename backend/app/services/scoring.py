import re
from typing import Dict, Any, List

def calculate_prompt_score(prompt: str) -> Dict[str, Any]:
    text = prompt.strip()
    if not text:
        return {
            "score": 0,
            "breakdown": {
                "clarity": 0,
                "context": 0,
                "specificity": 0,
                "output_format": 0,
                "constraints": 0,
            },
            "tips": ["Type your prompt to evaluate quality"],
            "autopsy_items": []
        }

    words = text.split()
    word_count = len(words)
    lower_text = text.lower()

    # 1. Clarity (0-20)
    clarity = 8
    if word_count >= 5:
        clarity += 5
    if word_count >= 15:
        clarity += 4
    if text.endswith("?") or text.endswith(".") or text.endswith("!"):
        clarity += 3
    if word_count < 3:
        clarity = 4
    clarity = min(20, max(0, clarity))

    # 2. Context & Role Background (0-20)
    context = 4
    context_signals = [
        "act as", "role", "background", "context", "i am", "we are", "for a", "building",
        "scenario", "working on", "purpose", "target", "situation", "need this for", "senior",
        "expert", "architect", "engineer", "designer", "specialist", "administrator"
    ]
    for cs in context_signals:
        if cs in lower_text:
            context += 4
    if word_count >= 20:
        context += 4
    context = min(20, max(0, context))

    # 3. Specificity & Technical Depth (0-20)
    specificity = 4
    spec_signals = [
        "specifically", "version", "using", "such as", "including", "python",
        "react", "step-by-step", "detailed", "metrics", "data", "example",
        "postgresql", "sql", "database", "api", "query", "index", "function",
        "table", "fastapi", "docker", "algorithm", "schema"
    ]
    for ss in spec_signals:
        if ss in lower_text:
            specificity += 4
    # Penalize vague phrases
    vague_phrases = ["something", "stuff", "make it good", "help with this", "anything", "whatever"]
    for vp in vague_phrases:
        if vp in lower_text:
            specificity -= 4
    specificity = min(20, max(0, specificity))

    # 4. Output Format (0-20)
    output_format = 4
    format_signals = [
        "json", "markdown", "table", "bullet points", "bullets", "list", "code", "csv",
        "format as", "output format", "schema", "summary", "paragraph", "step-by-step",
        "steps", "comparing", "comparison"
    ]
    for fs in format_signals:
        if fs in lower_text:
            output_format += 5
    output_format = min(20, max(0, output_format))

    # 5. Constraints & Boundaries (0-20)
    constraints = 4
    constraint_signals = [
        "do not", "don't", "avoid", "only", "under", "limit to", "maximum",
        "without", "strictly", "no preamble", "must include", "ensure that",
        "introductory", "pleasantries", "deprecations"
    ]
    for cs in constraint_signals:
        if cs in lower_text:
            constraints += 6
    constraints = min(20, max(0, constraints))

    total_score = clarity + context + specificity + output_format + constraints

    # Actionable 1-line tips
    tips: List[str] = []
    if output_format < 12:
        tips.append("Specify the desired output format (e.g. 'Format as a Markdown table' or 'Return JSON')")
    if constraints < 10:
        tips.append("Add clear boundary constraints (e.g. 'Avoid fluff, limit response to 3 steps')")
    if context < 10:
        tips.append("Give more context about your role, project, or target audience")
    if specificity < 10:
        tips.append("Replace vague terms with concrete technologies, metrics, or requirements")
    if clarity < 12 and word_count < 6:
        tips.append("Expand on what you want to achieve for more accurate answers")
    
    if not tips:
        tips.append("Excellent prompt structure! Well-grounded with clear constraints and formatting.")

    # Autopsy highlights for the "Prompt Autopsy" standout feature
    autopsy_items = []
    for vp in ["something", "stuff", "good", "nice", "anything"]:
        match = re.search(r"\b" + re.escape(vp) + r"\b", lower_text)
        if match:
            autopsy_items.append({
                "word": vp,
                "type": "vague_term",
                "message": f"'{vp}' is ambiguous. Specify exact requirements or criteria.",
                "fix": "defined specification"
            })
    if output_format < 10:
        autopsy_items.append({
            "word": "output",
            "type": "missing_format",
            "message": "No output format specified. The model may format unpredictably.",
            "fix": "Format as a structured list with code examples."
        })
    if constraints < 8:
        autopsy_items.append({
            "word": "boundaries",
            "type": "missing_constraints",
            "message": "Missing negative constraints or length bounds.",
            "fix": "Keep concise, avoid preamble, focus on modern syntax."
        })

    return {
        "score": total_score,
        "breakdown": {
            "clarity": clarity,
            "context": context,
            "specificity": specificity,
            "output_format": output_format,
            "constraints": constraints,
        },
        "tips": tips,
        "autopsy_items": autopsy_items
    }
