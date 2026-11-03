from typing import Dict, Any, List

STRATEGIES: Dict[str, Dict[str, Any]] = {
    "add_role": {
        "id": "add_role",
        "name": "Expert Role Definition",
        "description": "Establishes an authoritative persona tailored to the domain.",
        "instruction": "Explicitly assign a high-caliber expert role (e.g., 'Act as a Senior Principal Software Architect', 'Act as an award-winning investigative journalist') with deep domain background.",
        "explanation": "Added a specialized expert role to focus domain authority and terminology."
    },
    "add_context": {
        "id": "add_context",
        "name": "Context & Background Grounding",
        "description": "Supplies essential foundational context, purpose, and target scenario.",
        "instruction": "Frame why this output is needed, the target scenario, prerequisites, and relevant surrounding circumstances.",
        "explanation": "Provided grounding context and clear business/technical objectives."
    },
    "add_constraints": {
        "id": "add_constraints",
        "name": "Negative & Boundary Constraints",
        "description": "Defines what NOT to do, strict bounds, length, and performance limits.",
        "instruction": "State explicit boundaries (e.g., 'avoid unnecessary preamble', 'limit to 3 paragraphs', 'do not use deprecated libraries', 'production-grade with type annotations').",
        "explanation": "Added concrete boundaries and negative constraints to prevent hallucination and verbosity."
    },
    "add_output_format": {
        "id": "add_output_format",
        "name": "Structured Output Formatting",
        "description": "Demands exact output schema like JSON, Markdown tables, or step lists.",
        "instruction": "Specify the exact presentation structure (e.g., 'Return markdown with ### headers, bulleted takeaways, and a comparison table' or 'Output strict JSON with fields ...').",
        "explanation": "Defined strict output structure to make the response immediately readable and actionable."
    },
    "few_shot_examples": {
        "id": "few_shot_examples",
        "name": "Exemplar Pattern (Few-Shot)",
        "description": "Provides ideal input/output pattern demonstrations.",
        "instruction": "Provide a brief exemplar pattern showing the expected input and ideal output format/depth.",
        "explanation": "Added exemplar pattern demonstration to calibrate response quality."
    },
    "chain_of_thought": {
        "id": "chain_of_thought",
        "name": "Reasoning & Chain of Thought",
        "description": "Guides the model through transparent step-by-step reasoning before concluding.",
        "instruction": "Prompt the model to reason through trade-offs, edge cases, and principles step-by-step before producing final recommendations.",
        "explanation": "Instructed step-by-step reasoning to systematically evaluate nuances and edge cases."
    },
    "step_by_step_breakdown": {
        "id": "step_by_step_breakdown",
        "name": "Sequential Milestone Breakdown",
        "description": "Deconstructs complex goals into numbered sequential steps.",
        "instruction": "Deconstruct the request into numbered, logical steps from setup to execution and verification.",
        "explanation": "Deconstructed the prompt into sequenced logical steps."
    },
    "clarify_ambiguity": {
        "id": "clarify_ambiguity",
        "name": "Disambiguation & Precision",
        "description": "Replaces vague pronouns, ambiguous words, and hand-wavy goals with quantifiable metrics.",
        "instruction": "Identify vague phrases ('good', 'fast', 'make something') and replace them with specific metrics, technologies, and explicit requirements.",
        "explanation": "Replaced vague terminology with precise, quantifiable requirements."
    },
    "concise_rewrite": {
        "id": "concise_rewrite",
        "name": "Concise Semantic Density",
        "description": "Strips out conversational pleasantries, redundant filler, and bloat.",
        "instruction": "Strip out conversational pleasantries ('Hello', 'Could you please', 'I was wondering') and condense into high-density direct imperative instructions.",
        "explanation": "Condensed into high-density imperative commands, eliminating filler."
    },
    "audience_targeting": {
        "id": "audience_targeting",
        "name": "Target Audience Calibration",
        "description": "Calibrates tone, vocabulary, and depth to a specific audience level.",
        "instruction": "Calibrate technical depth and terminology specifically for the target audience (e.g., 'C-suite executives', 'junior CS students', 'end-users with zero tech background').",
        "explanation": "Calibrated vocabulary and conceptual depth for the specific target audience."
    }
}

DEFAULT_TASK_STRATEGIES: Dict[str, List[str]] = {
    "coding": ["add_role", "add_constraints", "add_output_format", "chain_of_thought"],
    "math": ["chain_of_thought", "step_by_step_breakdown", "add_constraints"],
    "writing": ["audience_targeting", "add_role", "add_constraints", "clarify_ambiguity"],
    "research": ["add_role", "add_context", "chain_of_thought", "add_output_format"],
    "summarization": ["concise_rewrite", "add_output_format", "add_constraints"],
    "translation": ["add_context", "audience_targeting", "add_constraints"],
    "data_analysis": ["add_role", "step_by_step_breakdown", "add_output_format"],
    "brainstorming": ["add_role", "add_output_format", "few_shot_examples"],
    "general_qa": ["add_role", "add_context", "add_output_format", "clarify_ambiguity"]
}

