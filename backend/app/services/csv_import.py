import pandas as pd
from decimal import Decimal, InvalidOperation
from datetime import date
from dataclasses import dataclass, field


@dataclass
class ParsedTransaction:
    date: date
    description: str
    amount: Decimal


@dataclass
class SkippedRow:
    row_number: int
    reason: str


@dataclass
class ParseResult:
    transactions: list[ParsedTransaction]
    skipped_rows: list[SkippedRow] = field(default_factory=list)


class CSVParseError(Exception):
    """Raised when the uploaded CSV doesn't match the expected format at all."""
    pass


# Common column-name variants seen across bank/card export formats.
COLUMN_ALIASES = {
    "date": {"date", "transaction date", "posted date", "posting date", "trans date"},
    "description": {"description", "memo", "details", "narrative", "payee", "merchant"},
    "amount": {"amount", "value", "transaction amount", "amt"},
}

REQUIRED_COLUMNS = set(COLUMN_ALIASES.keys())


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    rename_map = {}
    for column in df.columns:
        key = str(column).strip().lower()
        for canonical, aliases in COLUMN_ALIASES.items():
            if key in aliases:
                rename_map[column] = canonical
                break
    return df.rename(columns=rename_map)


def parse_csv(file_content: bytes) -> ParseResult:
    try:
        df = pd.read_csv(pd.io.common.BytesIO(file_content))
    except Exception as e:
        raise CSVParseError(f"Could not read file as CSV: {e}")

    df = _normalize_columns(df)

    missing_columns = REQUIRED_COLUMNS - set(df.columns)
    if missing_columns:
        raise CSVParseError(f"Missing required columns: {sorted(missing_columns)}")

    transactions: list[ParsedTransaction] = []
    skipped_rows: list[SkippedRow] = []

    for idx, row in df.iterrows():
        try:
            transactions.append(
                ParsedTransaction(
                    date=pd.to_datetime(row["date"]).date(),
                    description=str(row["description"]).strip(),
                    amount=Decimal(str(row["amount"])),
                )
            )
        except (ValueError, TypeError, InvalidOperation) as e:
            skipped_rows.append(SkippedRow(row_number=int(idx) + 2, reason=str(e)))

    return ParseResult(transactions=transactions, skipped_rows=skipped_rows)
