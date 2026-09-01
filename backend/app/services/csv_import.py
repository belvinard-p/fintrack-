import pandas as pd
from decimal import Decimal
from datetime import date
from dataclasses import dataclass


@dataclass
class ParsedTransaction:
    date: date
    description: str
    amount: Decimal


class CSVParseError(Exception):
    """Raised when the uploaded CSV doesn't match the expected format."""
    pass


REQUIRED_COLUMNS = {"date", "description", "amount"}


def parse_csv(file_content: bytes) -> list[ParsedTransaction]:
    try:
        df = pd.read_csv(pd.io.common.BytesIO(file_content))
    except Exception as e:
        raise CSVParseError(f"Could not read file as CSV: {e}")

    missing_columns = REQUIRED_COLUMNS - set(df.columns)
    if missing_columns:
        raise CSVParseError(f"Missing required columns: {missing_columns}")

    parsed = []

    for _, row in df.iterrows():
        try:
            parsed.append(
                ParsedTransaction(
                    date=pd.to_datetime(row["date"]).date(),
                    description=str(row["description"]).strip(),
                    amount=Decimal(str(row["amount"])),
                )
            )
        except (ValueError, TypeError) as e:
            raise CSVParseError(f"Invalid row data: {row.to_dict()} — {e}")

    return parsed