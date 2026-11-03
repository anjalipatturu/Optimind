import re
from typing import Dict, Any, List

TASK_KEYWORDS = {
    "coding": [
        "code", "python", "javascript", "react", "bug", "error", "api", "function", 
        "algorithm", "database", "sql", "css", "html", "class", "async", "docker", 
        "backend", "frontend", "git", "script", "terminal", "compile"
    ],
    "math": [
        "calculate", "equation", "formula", "integral", "derivative", "probability",
        "solve", "geometry", "algebra", "matrix", "theorem", "proof", "statistics"
    ],
    "translation": [
        "translate", "in spanish", "in french", "in hindi", "in german", "in telugu",
        "in tamil", "to english", "meaning in", "how to say"
    ],
    "summarization": [
        "summarize", "tl;dr", "summary", "brief", "digest", "key takeaways", "bullet points of"
    ],
    "research": [
        "paper", "study", "citation", "literature", "methodology", "academic", "history of",
        "analyze the impact", "pros and cons", "compare and contrast", "market trends"
    ],
    "writing": [
        "essay", "article", "blog", "story", "email", "draft", "poem", "script",
        "rewrite", "tone", "headline", "dialogue", "copywriting"
    ],
    "data_analysis": [
        "dataset", "csv", "trend", "correlation", "visualization", "chart", "metrics",
        "kpi", "outlier", "distribution", "pandas", "clean data"
    ],
    "brainstorming": [
        "ideas", "brainstorm", "suggest", "names for", "innovative", "creative concepts",
        "strategies for", "what are some ways"
    ]
}

def detect_language(text: str) -> str:
    # Basic script detection
    if re.search(r"[\u0900-\u097F]", text):
        return "hi" # Hindi / Devanagari
    if re.search(r"[\u0C00-\u0C7F]", text):
        return "te" # Telugu
    if re.search(r"[\u0B80-\u0BFF]", text):
        return "ta" # Tamil
    if re.search(r"[\u0600-\u06FF]", text):
        return "ar" # Arabic
    if re.search(r"[\u4E00-\u9FFF]", text):
        return "zh" # Chinese
    if re.search(r"[\u3040-\u309F\u30A0-\u30FF]", text):
        return "ja" # Japanese
    if re.search(r"\b(que|el|la|los|las|por|para|con|una|uno)\b", text, re.IGNORECASE):
        return "es" # Spanish
    if re.search(r"\b(le|la|les|des|un|une|avec|pour|dans)\b", text, re.IGNORECASE):
        return "fr" # French
    return "en"

def classify_task(prompt: str) -> Dict[str, Any]:
    text_lower = prompt.lower()
    scores: Dict[str, int] = {}
    
    for task, keywords in TASK_KEYWORDS.items():
        score = sum(1 for kw in keywords if re.search(r"\b" + re.escape(kw) + r"\b", text_lower))
        if score > 0:
            scores[task] = score

    if scores:
        best_task = max(scores, key=scores.get)
    else:
        best_task = "general_qa"

    word_count = len(prompt.split())
    complexity = "simple" if word_count < 15 else ("moderate" if word_count < 50 else "complex")
    
    # Check vague words
    vague_words = ["something", "stuff", "good", "nice", "make it better", "help with this"]
    vague_count = sum(1 for vw in vague_words if vw in text_lower)
    
    return {
        "task_type": best_task,
        "language": detect_language(prompt),
        "complexity": complexity,
        "word_count": word_count,
        "has_vague_terms": vague_count > 0,
    }

