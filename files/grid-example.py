"""Reproduce the examples in the grid-diagram article (Python 3, standard library).

Coordinates: columns and rows start at 0; rows increase upwards. X and O
lie at cell centers. A state is a permutation giving the row of the grid-line
intersection in each column. Opposite edges are identified.

This computes the fully blocked (tilde) complex over F_2: rectangles must
avoid all X, all O, and interior state points. It is not the minus complex.
"""

from collections import Counter
from itertools import permutations
from math import comb
import json


def rank_mod2(columns):
    pivots = {}
    for column in columns:
        while column:
            pivot = column.bit_length() - 1
            if pivot in pivots:
                column ^= pivots[pivot]
            else:
                pivots[pivot] = column
                break
    return len(pivots)


def count_sw_ne(first, second):
    return sum(ax < bx and ay < by for ax, ay in first for bx, by in second)


def maslov(points, markings):
    return (count_sw_ne(points, points) - count_sw_ne(points, markings)
            - count_sw_ne(markings, points) + count_sw_ne(markings, markings) + 1)


def compute(o_columns_by_row, x_columns_by_row):
    n = len(o_columns_by_row)
    assert sorted(o_columns_by_row) == sorted(x_columns_by_row) == list(range(n))
    assert all(o != x for o, x in zip(o_columns_by_row, x_columns_by_row))
    os = [(c + .5, r + .5) for r, c in enumerate(o_columns_by_row)]
    xs = [(c + .5, r + .5) for r, c in enumerate(x_columns_by_row)]
    states = list(permutations(range(n)))
    indices = {s: i for i, s in enumerate(states)}
    grades = []
    differential = []
    rectangle_records = []
    for state in states:
        points = list(enumerate(state))
        m = maslov(points, os)
        twice_a = m - maslov(points, xs) - (n - 1)
        assert twice_a % 2 == 0
        grades.append((twice_a // 2, m))
        column = 0
        for left in range(n):
            for right in range(n):
                if left == right:
                    continue
                bottom = state[left]
                width = (right - left) % n
                height = (state[right] - bottom) % n
                if any(0 < (c-left) % n < width and 0 < (state[c]-bottom) % n < height
                       for c in range(n)):
                    continue
                if any((c-left) % n < width and (r-bottom) % n < height
                       for r, c in enumerate(o_columns_by_row)):
                    continue
                if any((c-left) % n < width and (r-bottom) % n < height
                       for r, c in enumerate(x_columns_by_row)):
                    continue
                target = list(state)
                target[left], target[right] = target[right], target[left]
                target = tuple(target)
                column ^= 1 << indices[target]
                rectangle_records.append({"source": state, "target": target,
                                          "left": left, "bottom": bottom,
                                          "width": width, "height": height})
        differential.append(column)
    for source, column in enumerate(differential):
        square = 0
        while column:
            bit = column & -column
            target = bit.bit_length() - 1
            assert grades[target] == (grades[source][0], grades[source][1] - 1)
            square ^= differential[target]
            column ^= bit
        assert square == 0, "The differential must square to zero"
    dimensions = Counter(grades)
    ranks = {grade: rank_mod2([differential[i] for i, g in enumerate(grades) if g == grade])
             for grade in dimensions}
    homology = {grade: dimension - ranks[grade] - ranks.get((grade[0], grade[1]+1), 0)
                for grade, dimension in dimensions.items()}
    homology = {grade: dimension for grade, dimension in homology.items() if dimension}
    remaining = Counter(homology)
    hat = Counter()
    while remaining:
        a, m = max(remaining)
        multiplicity = remaining[a, m]
        assert multiplicity > 0
        hat[a, m] += multiplicity
        for k in range(n):
            grade = (a-k, m-k)
            remaining[grade] -= multiplicity * comb(n-1, k)
            assert remaining[grade] >= 0, "The V-factor must divide the bigraded ranks"
            if not remaining[grade]:
                del remaining[grade]
    euler = Counter()
    for (a, m), multiplicity in hat.items():
        euler[a] += (-1 if m % 2 else 1) * multiplicity
    return {"grid_size": n, "O_columns_by_row": o_columns_by_row,
            "X_columns_by_row": x_columns_by_row,
            "states": len(states), "differential_rank": rank_mod2(differential),
            "homology_dimension": sum(homology.values()),
            "bigraded_homology": [{"Alexander": a, "Maslov": m, "dimension": dim}
                                   for (a, m), dim in sorted(homology.items())],
            "rectangle_contributions": len(rectangle_records),
            "hat_dimension": sum(hat.values()),
            "hat_bigraded_homology": [{"Alexander": a, "Maslov": m, "dimension": dim}
                                      for (a, m), dim in sorted(hat.items())],
            "euler_characteristic": dict(sorted(euler.items())),
            "nonwrapping_rectangle_example": next((r for r in rectangle_records
                if r["left"]+r["width"] < n and r["bottom"]+r["height"] < n), None)}


if __name__ == "__main__":
    print(json.dumps({
        "unknot": compute([0, 1], [1, 0]),
        "trefoil": compute([3, 2, 1, 0, 4], [0, 4, 3, 2, 1]),
    }, indent=2))
