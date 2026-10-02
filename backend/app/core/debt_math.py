from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

TWO_PLACES = Decimal("0.01")


def split_payment(
    remaining_balance: Decimal,
    annual_rate: Optional[Decimal],
    amount: Decimal,
) -> tuple[Decimal, Decimal]:
    """Split a debt payment into (principal_portion, interest_portion).

    Interest is computed on the balance before this payment is applied, using
    a simple monthly rate (annual_rate / 12). Whatever is left of the payment
    goes to principal, clamped to [0, remaining_balance] so a payment smaller
    than the interest due never produces negative principal, and an
    overpayment never drives the debt below zero.
    """
    if not annual_rate:
        interest_portion = Decimal("0.00")
    else:
        monthly_rate = annual_rate / Decimal("100") / Decimal("12")
        interest_portion = (remaining_balance * monthly_rate).quantize(
            TWO_PLACES, rounding=ROUND_HALF_UP
        )

    principal_portion = amount - interest_portion
    principal_portion = max(Decimal("0.00"), min(principal_portion, remaining_balance))

    return principal_portion, interest_portion
