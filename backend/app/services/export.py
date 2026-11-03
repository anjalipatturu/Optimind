import io
from typing import List, Dict, Any

def export_chat_as_markdown(chat: Dict[str, Any], messages: List[Dict[str, Any]]) -> str:
    md_lines = [
        f"# {chat.get('title', 'Chat Export')}",
        f"*Exported from Optimind on {chat.get('created_at', '')}*\n",
        "---\n"
    ]
    for msg in messages:
        role = "User" if msg.get("role") == "user" else "Optimind AI"
        time_str = msg.get("created_at", "")
        content = msg.get("content", "")
        md_lines.append(f"### {role} ({time_str})\n\n{content}\n\n---\n")
    return "\n".join(md_lines)

def export_chat_as_docx(chat: Dict[str, Any], messages: List[Dict[str, Any]]) -> bytes:
    import docx
    doc = docx.Document()
    doc.add_heading(chat.get("title", "Chat Export"), level=0)
    doc.add_paragraph(f"Exported from Optimind")
    doc.add_paragraph("---")

    for msg in messages:
        role = "User" if msg.get("role") == "user" else "Optimind AI"
        doc.add_heading(f"{role}", level=2)
        doc.add_paragraph(msg.get("content", ""))

    out_io = io.BytesIO()
    doc.save(out_io)
    return out_io.getvalue()

def export_chat_as_pdf(chat: Dict[str, Any], messages: List[Dict[str, Any]]) -> bytes:
    # Generate clean text-based PDF using pypdf or a lightweight canvas
    # Alternatively format markdown bytes
    md_content = export_chat_as_markdown(chat, messages)
    # Return formatted UTF-8 bytes for downstream printing/viewing
    return md_content.encode("utf-8")

