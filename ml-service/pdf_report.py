import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT

C_PURPLE = colors.HexColor("#6366f1")
C_DARK   = colors.HexColor("#1e293b")
C_GRAY   = colors.HexColor("#64748b")
C_GREEN  = colors.HexColor("#10b981")
C_AMBER  = colors.HexColor("#f59e0b")
C_WHITE  = colors.white

SALARY_COLORS  = {"Low": C_AMBER, "Mid": C_PURPLE, "High": C_GREEN}
MODEL_LABELS   = {"knn": "K-Nearest Neighbors", "naive_bayes": "Naive Bayes", "svm": "Support Vector Machine"}
EDUCATION_LBLS = ["Bachelor's", "Master's", "PhD"]
LOCATION_LBLS  = ["Rural", "City", "Metro", "Capital"]
JOB_LBLS       = ["Junior", "Mid-level", "Senior"]

def S(name, **kw):
    d = dict(fontName="Helvetica", fontSize=9.5, leading=14, textColor=C_DARK, spaceAfter=0, spaceBefore=0)
    d.update(kw)
    return ParagraphStyle(name, **d)

ST = {
    "h1":       S("h1",  fontName="Helvetica-Bold", fontSize=15, textColor=C_DARK, spaceBefore=12, spaceAfter=3),
    "body":     S("body", fontSize=9, textColor=C_GRAY, leading=13),
    "bold":     S("bold", fontName="Helvetica-Bold", fontSize=9.5, textColor=C_DARK),
    "center":   S("center", alignment=TA_CENTER, fontSize=9, textColor=C_GRAY),
    "wh_big":   S("wh_big", fontName="Helvetica-Bold", fontSize=20, textColor=C_WHITE, alignment=TA_CENTER),
    "wh_sm":    S("wh_sm", fontSize=8.5, textColor=C_WHITE, alignment=TA_CENTER),
    "badge":    S("badge", fontName="Helvetica-Bold", fontSize=17, textColor=C_WHITE, alignment=TA_CENTER),
    "sal_big":  S("sal_big", fontName="Helvetica-Bold", fontSize=17, textColor=C_DARK, alignment=TA_CENTER),
    "sal_lbl":  S("sal_lbl", fontSize=7.5, textColor=C_GRAY, alignment=TA_CENTER),
    "met_val":  S("met_val", fontName="Helvetica-Bold", fontSize=16, textColor=C_PURPLE, alignment=TA_CENTER),
    "met_lbl":  S("met_lbl", fontSize=7.5, textColor=C_GRAY, alignment=TA_CENTER),
    "footer":   S("footer", fontSize=7.5, textColor=C_GRAY, alignment=TA_CENTER),
}


def build_report_pdf(data: dict) -> bytes:
    prediction   = data.get("prediction", "Mid")
    salary_range = data.get("salary_range", {"min": 0, "mid": 0, "max": 0})
    confidence   = data.get("confidence", "N/A")
    accuracy     = data.get("accuracy", 0)
    precision    = data.get("precision", 0)
    recall       = data.get("recall", 0)
    f1_score     = data.get("f1_score", 0)
    model_used   = data.get("model_used", "svm")
    model_desc   = data.get("model_description", "")
    tip          = data.get("tip", "")
    experience   = int(data.get("experience", 0))
    education    = int(data.get("education", 0))
    skills       = int(data.get("skills", 0))
    location     = int(data.get("location", 0))
    job_type     = int(data.get("job_type", 0))
    all_metrics  = data.get("all_metrics", {})
    generated_at = datetime.now().strftime("%B %d, %Y at %I:%M %p")

    sal_color = SALARY_COLORS.get(prediction, C_PURPLE)
    sal_hex   = sal_color.hexval()[2:]   # strip "0x"

    buf = io.BytesIO()
    W   = A4[0] - 36*mm
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            leftMargin=18*mm, rightMargin=18*mm,
                            topMargin=12*mm,  bottomMargin=16*mm)
    story = []

    # ── 1. Header ─────────────────────────────────────────────────────────
    hdr = Table([[
        Paragraph("💼 SalaryIQ", ST["wh_big"]),
        Paragraph(f"ML-Powered Salary Prediction Report<br/>"
                  f"<font size='8'>Generated: {generated_at}</font>", ST["wh_sm"]),
    ]], colWidths=[W*0.36, W*0.64])
    hdr.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(-1,-1), C_PURPLE),
        ("VALIGN",     (0,0),(-1,-1), "MIDDLE"),
        ("PADDING",    (0,0),(-1,-1), 12),
        ("ROUNDEDCORNERS", [8]),
    ]))
    story += [hdr, Spacer(1,10)]

    # ── 2. Prediction result ───────────────────────────────────────────────
    story.append(Paragraph("Prediction Result", ST["h1"]))
    story.append(HRFlowable(width=W, thickness=1.5, color=C_PURPLE, spaceAfter=7))

    badge = Table([[Paragraph(f"{prediction} Income", ST["badge"])]], colWidths=[W])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0,0),(-1,-1), sal_color),
        ("PADDING",    (0,0),(-1,-1), 10),
        ("ROUNDEDCORNERS", [10]),
    ]))
    story.append(badge)
    story.append(Spacer(1,5))
    story.append(Paragraph(
        f"Model: <b>{MODEL_LABELS.get(model_used, model_used)}</b> &nbsp;|&nbsp; Confidence: <b>{confidence}%</b>",
        ST["center"]
    ))
    story.append(Spacer(1,8))

    # Salary range row
    sal_tbl = Table([
        [Paragraph("Minimum", ST["sal_lbl"]),   Paragraph("Expected",  ST["sal_lbl"]),  Paragraph("Maximum", ST["sal_lbl"])],
        [Paragraph(f"${salary_range.get('min',0):,}", ST["sal_big"]),
         Paragraph(f"<font color='#{sal_hex}' size='20'><b>${salary_range.get('mid',0):,}</b></font>",
                   S("smid", fontName="Helvetica-Bold", fontSize=20, alignment=TA_CENTER)),
         Paragraph(f"${salary_range.get('max',0):,}", ST["sal_big"])],
    ], colWidths=[W/3]*3)
    sal_tbl.setStyle(TableStyle([
        ("BACKGROUND",     (0,0),(-1,-1), colors.HexColor("#f8fafc")),
        ("ALIGN",          (0,0),(-1,-1), "CENTER"),
        ("VALIGN",         (0,0),(-1,-1), "MIDDLE"),
        ("PADDING",        (0,0),(-1,-1), 8),
        ("ROUNDEDCORNERS", [8]),
        ("LINEAFTER",      (0,0),(1,-1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    story += [sal_tbl, Spacer(1,14)]

    # ── 3. User Profile ───────────────────────────────────────────────────
    story.append(Paragraph("User Profile", ST["h1"]))
    story.append(HRFlowable(width=W, thickness=1, color=C_PURPLE, spaceAfter=6))

    edu_lbl = EDUCATION_LBLS[education] if education < len(EDUCATION_LBLS) else education
    loc_lbl = LOCATION_LBLS[location]   if location  < len(LOCATION_LBLS)  else location
    job_lbl = JOB_LBLS[job_type]        if job_type  < len(JOB_LBLS)       else job_type

    prof_rows = [
        ["Experience", f"{experience} years",  "Education",  edu_lbl],
        ["Skill Score", f"{skills} / 10",      "Location",   loc_lbl],
        ["Job Level",   job_lbl,               "",           ""],
    ]
    fmt = [[Paragraph(r[0],ST["bold"]), Paragraph(str(r[1]),ST["body"]),
            Paragraph(r[2],ST["bold"]), Paragraph(str(r[3]),ST["body"])]
           for r in prof_rows]
    prof_tbl = Table(fmt, colWidths=[W*0.18, W*0.32, W*0.18, W*0.32])
    prof_tbl.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0,0),(-1,-1), [colors.HexColor("#f8fafc"), C_WHITE]),
        ("PADDING",        (0,0),(-1,-1), 7),
        ("VALIGN",         (0,0),(-1,-1), "MIDDLE"),
        ("ROUNDEDCORNERS", [6]),
    ]))
    story += [prof_tbl, Spacer(1,14)]

    # ── 4. Selected model — 4 metric boxes ───────────────────────────────
    story.append(Paragraph("Selected Model — Performance Metrics", ST["h1"]))
    story.append(HRFlowable(width=W, thickness=1, color=C_PURPLE, spaceAfter=6))

    metric_keys  = ["accuracy","precision","recall","f1_score"]
    metric_names = ["Accuracy","Precision","Recall","F1 Score"]
    metric_vals  = [accuracy, precision, recall, f1_score]

    mbox = Table([
        [Paragraph(n, ST["met_lbl"]) for n in metric_names],
        [Paragraph(f"<font color='#6366f1'><b>{v}%</b></font>",
                   S(f"mv{i}", fontName="Helvetica-Bold", fontSize=16, alignment=TA_CENTER))
         for i,v in enumerate(metric_vals)],
    ], colWidths=[W/4]*4)
    mbox.setStyle(TableStyle([
        ("BACKGROUND",  (0,0),(-1,-1), colors.HexColor("#eef2ff")),
        ("PADDING",     (0,0),(-1,-1), 10),
        ("ALIGN",       (0,0),(-1,-1), "CENTER"),
        ("VALIGN",      (0,0),(-1,-1), "MIDDLE"),
        ("ROUNDEDCORNERS", [8]),
        ("LINEBELOW",   (0,0),(-1,0), 0.5, colors.HexColor("#c7d2fe")),
    ]))
    story += [mbox, Spacer(1,14)]

    # ── 5. All models comparison table ────────────────────────────────────
    story.append(Paragraph("All Models — Comparison Table", ST["h1"]))
    story.append(HRFlowable(width=W, thickness=1, color=C_PURPLE, spaceAfter=5))
    story.append(Paragraph(
        "Metrics computed on a 20% held-out test set using weighted averaging across Low / Mid / High classes.",
        ST["body"]
    ))
    story.append(Spacer(1,6))

    th_style = S("th", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE)
    th_c     = S("thc", fontName="Helvetica-Bold", fontSize=9, textColor=C_WHITE, alignment=TA_CENTER)

    tbl_rows = [[Paragraph(h, th_style if i==0 else th_c)
                 for i,h in enumerate(["Model","Accuracy","Precision","Recall","F1 Score"])]]

    display = all_metrics if all_metrics else {model_used: {"accuracy":accuracy,"precision":precision,"recall":recall,"f1_score":f1_score}}
    comp_styles = [
        ("BACKGROUND",     (0,0),(-1,0), C_PURPLE),
        ("ROWBACKGROUNDS", (0,1),(-1,-1), [colors.HexColor("#f8fafc"), C_WHITE]),
        ("PADDING",        (0,0),(-1,-1), 7),
        ("VALIGN",         (0,0),(-1,-1), "MIDDLE"),
        ("GRID",           (0,0),(-1,-1), 0.3, colors.HexColor("#e2e8f0")),
        ("ROUNDEDCORNERS", [6]),
    ]
    for ri, (mkey, mvals) in enumerate(display.items()):
        is_sel = (mkey == model_used)
        ns = S(f"n{ri}", fontName="Helvetica-Bold" if is_sel else "Helvetica",
               fontSize=9, textColor=C_PURPLE if is_sel else C_DARK)
        vs = S(f"v{ri}", fontName="Helvetica-Bold" if is_sel else "Helvetica",
               fontSize=9, textColor=C_PURPLE if is_sel else C_DARK, alignment=TA_CENTER)
        row = [Paragraph(("★ " if is_sel else "  ") + MODEL_LABELS.get(mkey, mkey), ns)]
        row += [Paragraph(f"{mvals.get(k,'N/A')}%", vs) for k in metric_keys]
        tbl_rows.append(row)
        if is_sel:
            comp_styles.append(("BACKGROUND",(0,ri+1),(-1,ri+1), colors.HexColor("#eef2ff")))

    comp_tbl = Table(tbl_rows, colWidths=[W*0.36, W*0.16, W*0.16, W*0.16, W*0.16])
    comp_tbl.setStyle(TableStyle(comp_styles))
    story += [comp_tbl, Spacer(1,14)]

    # ── 6. Metrics explained (table, NOT separate text blocks) ────────────
    story.append(Paragraph("Metrics Explained", ST["h1"]))
    story.append(HRFlowable(width=W, thickness=1, color=C_PURPLE, spaceAfter=6))

    explanations = [
        ("Accuracy",  "Percentage of total predictions that are correct. Good overall indicator but can be misleading with imbalanced classes."),
        ("Precision", "Of all predicted positives, how many are truly positive. High precision = fewer false alarms."),
        ("Recall",    "Of all actual positives, how many did the model correctly find. High recall = fewer misses."),
        ("F1 Score",  "Harmonic mean of Precision and Recall — best single metric for imbalanced datasets like this salary dataset."),
    ]
    exp_rows = [[Paragraph(t, S(f"et{i}", fontName="Helvetica-Bold", fontSize=9.5, textColor=C_PURPLE)),
                 Paragraph(d, S(f"ed{i}", fontSize=9, textColor=C_GRAY, leading=13))]
                for i,(t,d) in enumerate(explanations)]
    exp_tbl = Table(exp_rows, colWidths=[W*0.17, W*0.83])
    exp_tbl.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0,0),(-1,-1), [colors.HexColor("#f8fafc"), C_WHITE]),
        ("PADDING",        (0,0),(-1,-1), 8),
        ("VALIGN",         (0,0),(-1,-1), "TOP"),
        ("LINEBEFORE",     (0,0),(0,-1), 2, C_PURPLE),
        ("ROUNDEDCORNERS", [6]),
    ]))
    story += [exp_tbl, Spacer(1,14)]

    # ── 7. About the model ────────────────────────────────────────────────
    story.append(Paragraph("About the Selected Model", ST["h1"]))
    story.append(HRFlowable(width=W, thickness=1, color=C_PURPLE, spaceAfter=6))
    about = Table([[
        Paragraph(MODEL_LABELS.get(model_used, model_used),
                  S("an", fontName="Helvetica-Bold", fontSize=9.5, textColor=C_PURPLE)),
        Paragraph(model_desc, S("ad", fontSize=9, textColor=C_GRAY, leading=13)),
    ]], colWidths=[W*0.27, W*0.73])
    about.setStyle(TableStyle([
        ("BACKGROUND",  (0,0),(-1,-1), colors.HexColor("#f8fafc")),
        ("PADDING",     (0,0),(-1,-1), 10),
        ("VALIGN",      (0,0),(-1,-1), "TOP"),
        ("LINEBEFORE",  (0,0),(0,-1), 2, C_PURPLE),
        ("ROUNDEDCORNERS", [6]),
    ]))
    story += [about, Spacer(1,14)]

    # ── 8. Career tip ─────────────────────────────────────────────────────
    tip_tbl = Table([[
        Paragraph("💡", S("ti", fontSize=16, alignment=TA_CENTER)),
        [Paragraph("Career Tip", S("tt", fontName="Helvetica-Bold", fontSize=10, textColor=colors.HexColor("#92400e"))),
         Spacer(1,3),
         Paragraph(tip, S("tb", fontSize=9, textColor=colors.HexColor("#78350f"), leading=13))],
    ]], colWidths=[W*0.07, W*0.93])
    tip_tbl.setStyle(TableStyle([
        ("BACKGROUND",  (0,0),(-1,-1), colors.HexColor("#fefce8")),
        ("PADDING",     (0,0),(-1,-1), 10),
        ("VALIGN",      (0,0),(-1,-1), "TOP"),
        ("LINEBEFORE",  (0,0),(0,-1), 2, C_AMBER),
        ("ROUNDEDCORNERS", [6]),
    ]))
    story += [tip_tbl, Spacer(1,14)]

    # ── 9. Footer ─────────────────────────────────────────────────────────
    story.append(HRFlowable(width=W, thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=5))
    story.append(Paragraph(
        "SalaryIQ — ML Salary Predictor  |  Built with KNN, Naive Bayes &amp; SVM  |  MERN + Flask Stack",
        ST["footer"]
    ))

    doc.build(story)
    return buf.getvalue()
