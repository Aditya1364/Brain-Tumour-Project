"""
PDF Report Generator
--------------------
Generates a professional clinical report using ReportLab.
"""

import os
from datetime import datetime


def generate_pdf_report(scan, patient) -> str:
    """Generate a PDF report and return its file path."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
        from reportlab.lib.enums import TA_CENTER, TA_LEFT

        out_path = f"reports/report_{scan.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        os.makedirs("reports", exist_ok=True)

        doc = SimpleDocTemplate(out_path, pagesize=A4,
                                leftMargin=2*cm, rightMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)

        DARK  = colors.HexColor("#0D1128")
        CYAN  = colors.HexColor("#00D4FF")
        RED   = colors.HexColor("#FF4757")
        AMBER = colors.HexColor("#FFB800")
        GREEN = colors.HexColor("#00C875")

        styles = getSampleStyleSheet()
        h1 = ParagraphStyle("h1", fontSize=22, textColor=DARK, fontName="Helvetica-Bold", spaceAfter=4)
        h2 = ParagraphStyle("h2", fontSize=13, textColor=DARK, fontName="Helvetica-Bold", spaceAfter=6, spaceBefore=14)
        body = ParagraphStyle("body", fontSize=10, textColor=colors.HexColor("#333"), leading=14)
        muted = ParagraphStyle("muted", fontSize=9, textColor=colors.HexColor("#888"))

        status_color = RED if (scan.status or "") == "Malignant" else AMBER if (scan.status or "") == "Benign" else GREEN

        story = []

        # Header
        story.append(Paragraph("NeuralOnco", h1))
        story.append(Paragraph("Brain Tumor Detection System — Clinical Report", muted))
        story.append(HRFlowable(width="100%", thickness=2, color=CYAN, spaceAfter=12))

        # Patient info table
        pat_name = patient.name if patient else "Unknown"
        pat_age  = str(patient.age) + " years" if patient and patient.age else "—"
        pat_gender = patient.gender if patient else "—"
        pat_id     = patient.patient_code if patient else "—"

        story.append(Paragraph("Patient Information", h2))
        p_data = [
            ["Patient Name", pat_name, "Patient ID", pat_id],
            ["Age", pat_age, "Gender", pat_gender],
            ["Scan Date", str(scan.created_at)[:10] if scan.created_at else "—", "MRI Type", scan.mri_type or "—"],
            ["Referred By", getattr(patient, "referred_by", "—") or "—", "Priority", getattr(patient, "priority", "Normal") or "Normal"],
        ]
        pt = Table(p_data, colWidths=[3.5*cm, 6*cm, 3.5*cm, 4.5*cm])
        pt.setStyle(TableStyle([
            ("FONTNAME", (0,0), (-1,-1), "Helvetica"),
            ("FONTSIZE", (0,0), (-1,-1), 9),
            ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
            ("FONTNAME", (2,0), (2,-1), "Helvetica-Bold"),
            ("TEXTCOLOR", (0,0), (0,-1), colors.HexColor("#555")),
            ("TEXTCOLOR", (2,0), (2,-1), colors.HexColor("#555")),
            ("ROWBACKGROUNDS", (0,0), (-1,-1), [colors.HexColor("#F7F9FC"), colors.white]),
            ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#DDD")),
            ("INNERGRID", (0,0), (-1,-1), 0.3, colors.HexColor("#EEE")),
            ("TOPPADDING", (0,0), (-1,-1), 5),
            ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ]))
        story.append(pt)
        story.append(Spacer(1, 12))

        # Diagnosis
        story.append(Paragraph("AI Diagnosis", h2))
        d_data = [
            ["Finding", (scan.status or "Pending").upper(), "Confidence", f"{scan.confidence or 0:.1f}%"],
            ["Tumor Type", scan.tumor_type or "—", "WHO Grade", scan.tumor_grade or "—"],
            ["Location", scan.tumor_location or "—", "Size", scan.tumor_size or "—"],
            ["Enhancement", scan.enhancement or "—", "Volume", f"{scan.tumor_volume or 0:.1f} cm³"],
        ]
        dt = Table(d_data, colWidths=[3.5*cm, 6*cm, 3.5*cm, 4.5*cm])
        dt.setStyle(TableStyle([
            ("FONTNAME", (0,0), (-1,-1), "Helvetica"),
            ("FONTSIZE", (0,0), (-1,-1), 9),
            ("FONTNAME", (0,0), (0,-1), "Helvetica-Bold"),
            ("FONTNAME", (2,0), (2,-1), "Helvetica-Bold"),
            ("TEXTCOLOR", (0,0), (0,-1), colors.HexColor("#555")),
            ("TEXTCOLOR", (2,0), (2,-1), colors.HexColor("#555")),
            ("TEXTCOLOR", (1,0), (1,0), status_color),
            ("FONTNAME", (1,0), (1,0), "Helvetica-Bold"),
            ("FONTSIZE", (1,0), (1,0), 11),
            ("ROWBACKGROUNDS", (0,0), (-1,-1), [colors.HexColor("#F7F9FC"), colors.white]),
            ("BOX", (0,0), (-1,-1), 0.5, colors.HexColor("#DDD")),
            ("INNERGRID", (0,0), (-1,-1), 0.3, colors.HexColor("#EEE")),
            ("TOPPADDING", (0,0), (-1,-1), 5),
            ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ]))
        story.append(dt)

        # Recommendation
        story.append(Paragraph("Clinical Recommendation", h2))
        story.append(Paragraph(scan.recommendation or "Consult a specialist.", body))

        # Footer
        story.append(Spacer(1, 24))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#CCC")))
        story.append(Spacer(1, 6))
        story.append(Paragraph(
            f"Generated by NeuralOnco v2.4.1 · {datetime.now().strftime('%d %b %Y %H:%M')} · "
            "This report is AI-assisted and must be reviewed by a qualified clinician.", muted
        ))

        doc.build(story)
        return out_path

    except Exception as e:
        print(f"PDF generation error: {e}")
        # Return a placeholder path
        return "reports/placeholder.pdf"
