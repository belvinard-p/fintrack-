from datetime import datetime, timezone
from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

HEADER_COLOR = colors.HexColor("#0f172a")
ROW_ALT_COLOR = colors.HexColor("#f1f5f9")
INCOME_COLOR = colors.HexColor("#059669")
EXPENSE_COLOR = colors.HexColor("#dc2626")


def generate_transactions_pdf(transactions, category_names: dict, user_email: str) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("FinTrack — Transaction Report", styles["Title"]))
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    elements.append(Paragraph(f"Account: {user_email}", styles["Normal"]))
    elements.append(Paragraph(f"Generated: {generated_at}", styles["Normal"]))
    elements.append(Spacer(1, 0.5 * cm))

    total_income = sum((t.amount for t in transactions if t.amount > 0), Decimal("0"))
    total_expenses = sum((t.amount for t in transactions if t.amount < 0), Decimal("0"))
    net = total_income + total_expenses

    summary_data = [
        ["Total income", f"{total_income:.2f}"],
        ["Total expenses", f"{total_expenses:.2f}"],
        ["Net", f"{net:.2f}"],
    ]
    summary_table = Table(summary_data, colWidths=[8 * cm, 4 * cm])
    summary_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.append(summary_table)
    elements.append(Spacer(1, 0.8 * cm))

    category_totals: dict[str, Decimal] = {}
    for t in transactions:
        name = category_names.get(t.category_id, "Uncategorized")
        category_totals[name] = category_totals.get(name, Decimal("0")) + t.amount

    if category_totals:
        elements.append(Paragraph("Spending by category", styles["Heading2"]))
        category_rows = [["Category", "Total"]] + [
            [name, f"{abs(total):.2f}"]
            for name, total in sorted(category_totals.items(), key=lambda item: abs(item[1]), reverse=True)
        ]
        category_table = Table(category_rows, colWidths=[8 * cm, 4 * cm])
        category_table.setStyle(_table_style())
        elements.append(category_table)
        elements.append(Spacer(1, 0.8 * cm))

    elements.append(Paragraph("Transactions", styles["Heading2"]))
    transaction_rows = [["Date", "Description", "Category", "Type", "Amount"]] + [
        [
            t.date.isoformat(),
            t.description,
            category_names.get(t.category_id, "Uncategorized"),
            "Income" if t.amount >= 0 else "Expense",
            f"{t.amount:.2f}",
        ]
        for t in transactions
    ]
    transaction_table = Table(
        transaction_rows,
        colWidths=[2.3 * cm, 5.2 * cm, 3.5 * cm, 2.5 * cm, 2.5 * cm],
        repeatRows=1,
    )
    style = _table_style()
    for row_index, t in enumerate(transactions, start=1):
        color = INCOME_COLOR if t.amount >= 0 else EXPENSE_COLOR
        style.add("TEXTCOLOR", (3, row_index), (4, row_index), color)
        style.add("FONTNAME", (3, row_index), (4, row_index), "Helvetica-Bold")
    transaction_table.setStyle(style)
    elements.append(transaction_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer


def _table_style() -> TableStyle:
    return TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), HEADER_COLOR),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ROW_ALT_COLOR]),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ]
    )
