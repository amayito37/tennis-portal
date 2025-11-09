import math

def calculate_elo_change(winner_points: int, loser_points: int) -> tuple[int, int]:
    """
    Returns (winner_delta, loser_delta) based on custom ELO rules.
    """
    diff = abs(winner_points - loser_points)

    # Same ELO
    if winner_points == loser_points:
        return 20, -20

    # Winner had higher ELO
    if winner_points > loser_points:
        # Extreme mismatch → no change
        if diff > 1000:
            return 0, 0
        delta = math.ceil((1001 - diff) / 50)
        return delta, -delta

    # Winner had lower ELO (upset win)
    delta = 20 + 3 * (diff // 10)
    # TODO: add points based on group result, group 1: 13 - group13: 1
    return delta, -delta


def revert_elo_change(winner, loser, db):
    """
    Reverts a previous ELO change by applying the inverse delta.
    Assumes both winner and loser are User ORM objects with .points.
    """
    # Get the delta based on *current* points at the time the original match happened
    # (This is approximate; exact reversal would require storing the deltas at match time.)
    d_win, d_lose = calculate_elo_change(winner.points, loser.points)

    # Apply the reverse
    winner.points -= d_win
    loser.points -= d_lose

    db.add(winner)
    db.add(loser)