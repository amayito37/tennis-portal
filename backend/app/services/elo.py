import math

def calculate_elo_change(winner_points: int, loser_points: int) -> tuple[int, int]:
    """
    Returns (winner_delta, loser_delta) based on custom ELO rules.
    """
    diff = abs(winner_points - loser_points)

    # Same ELO
    if winner_points == loser_points:
        return 21, -21

    # Winner had higher ELO
    if winner_points > loser_points:
        # Extreme mismatch → no change
        if diff > 1000:
            return 0, 0
        delta = math.ceil((1001 - diff) / 50)
        return delta, -delta

    # Winner had lower ELO (upset win)
    delta = 20 + 3 * (diff // 10)
    return delta, -delta
