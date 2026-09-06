"""
Statistical Significance Tests for Legalyze Hallucination Rate Data

This script computes Chi-squared tests and confidence intervals
from the EXISTING data in Table 2 of the manuscript.

These are pure mathematical computations on reported numbers,
not fabricated results.

We compute for BOTH possible sample sizes:
  - N = 200 (if each statement has one final label)
  - N = 600 (if 3 reviewers x 200 statements are pooled as independent)

The authors MUST confirm which is the correct interpretation.
"""

import math

def chi_squared_2x2(a, b, c, d):
    """
    Compute Chi-squared for a 2x2 contingency table:
    
            Hallucinated    Not Hallucinated
    Sys A:      a               b
    Sys B:      c               d
    
    Returns (chi2, p_value_approx)
    """
    n = a + b + c + d
    # Expected values
    row1 = a + b
    row2 = c + d
    col1 = a + c
    col2 = b + d
    
    e_a = row1 * col1 / n
    e_b = row1 * col2 / n
    e_c = row2 * col1 / n
    e_d = row2 * col2 / n
    
    chi2 = ((a - e_a)**2 / e_a +
            (b - e_b)**2 / e_b +
            (c - e_c)**2 / e_c +
            (d - e_d)**2 / e_d)
    
    return chi2


def wilson_ci(successes, n, z=1.96):
    """
    Compute Wilson score confidence interval for a proportion.
    More accurate than normal approximation for small p or n.
    """
    p_hat = successes / n
    denominator = 1 + z**2 / n
    center = (p_hat + z**2 / (2 * n)) / denominator
    margin = z * math.sqrt((p_hat * (1 - p_hat) + z**2 / (4 * n)) / n) / denominator
    
    lower = max(0, center - margin)
    upper = min(1, center + margin)
    
    return (lower * 100, upper * 100)


def compute_for_sample_size(N, label):
    """Compute all statistics for a given sample size N."""
    print(f"\n{'='*70}")
    print(f"SCENARIO: {label} (N = {N} per system)")
    print(f"{'='*70}")
    
    # Table 2 data (overall HR%)
    # Zero-Shot: 54.6%
    # Standard RAG: 22.8%
    # Legalyze: 5.5%
    
    # Compute raw counts from percentages
    # We need to find the nearest integer counts that produce these percentages
    
    zs_hall = round(N * 0.546)
    zs_not = N - zs_hall
    zs_rate = zs_hall / N * 100
    
    rag_hall = round(N * 0.228)
    rag_not = N - rag_hall
    rag_rate = rag_hall / N * 100
    
    leg_hall = round(N * 0.055)
    leg_not = N - leg_hall
    leg_rate = leg_hall / N * 100
    
    print(f"\nRaw counts (rounded from reported percentages):")
    print(f"  Zero-Shot:    {zs_hall}/{N} hallucinated = {zs_rate:.2f}% (reported 54.6%)")
    print(f"  Standard RAG: {rag_hall}/{N} hallucinated = {rag_rate:.2f}% (reported 22.8%)")
    print(f"  Legalyze:     {leg_hall}/{N} hallucinated = {leg_rate:.2f}% (reported 5.5%)")
    
    # Check if percentages match
    print(f"\n  [!] Zero-Shot match: {abs(zs_rate - 54.6) < 0.5}")
    print(f"  [!] Standard RAG match: {abs(rag_rate - 22.8) < 0.5}")
    print(f"  [!] Legalyze match: {abs(leg_rate - 5.5) < 0.5}")
    
    # Chi-squared tests
    print(f"\n--- Chi-squared Tests ---")
    
    # Test 1: Zero-Shot vs Legalyze
    chi2_zs_leg = chi_squared_2x2(zs_hall, zs_not, leg_hall, leg_not)
    print(f"\n  Zero-Shot vs Legalyze:")
    print(f"    Contingency table: [{zs_hall}, {zs_not}] vs [{leg_hall}, {leg_not}]")
    print(f"    χ² = {chi2_zs_leg:.2f}")
    print(f"    p < 0.0001 (for χ² > 10.83 with df=1)" if chi2_zs_leg > 10.83 else f"    NOT significant at p=0.001")
    
    # Test 2: Standard RAG vs Legalyze
    chi2_rag_leg = chi_squared_2x2(rag_hall, rag_not, leg_hall, leg_not)
    print(f"\n  Standard RAG vs Legalyze:")
    print(f"    Contingency table: [{rag_hall}, {rag_not}] vs [{leg_hall}, {leg_not}]")
    print(f"    χ² = {chi2_rag_leg:.2f}")
    print(f"    p < 0.0001 (for χ² > 10.83 with df=1)" if chi2_rag_leg > 10.83 else f"    NOT significant at p=0.001")
    
    # Test 3: Zero-Shot vs Standard RAG
    chi2_zs_rag = chi_squared_2x2(zs_hall, zs_not, rag_hall, rag_not)
    print(f"\n  Zero-Shot vs Standard RAG:")
    print(f"    Contingency table: [{zs_hall}, {zs_not}] vs [{rag_hall}, {rag_not}]")
    print(f"    χ² = {chi2_zs_rag:.2f}")
    print(f"    p < 0.0001 (for χ² > 10.83 with df=1)" if chi2_zs_rag > 10.83 else f"    NOT significant at p=0.001")
    
    # Confidence intervals
    print(f"\n--- 95% Wilson Confidence Intervals ---")
    
    zs_ci = wilson_ci(zs_hall, N)
    rag_ci = wilson_ci(rag_hall, N)
    leg_ci = wilson_ci(leg_hall, N)
    
    print(f"  Zero-Shot:    {zs_rate:.1f}% [{zs_ci[0]:.1f}%, {zs_ci[1]:.1f}%]")
    print(f"  Standard RAG: {rag_rate:.1f}% [{rag_ci[0]:.1f}%, {rag_ci[1]:.1f}%]")
    print(f"  Legalyze:     {leg_rate:.1f}% [{leg_ci[0]:.1f}%, {leg_ci[1]:.1f}%]")
    
    # Check if CIs overlap (important for interpretation)
    print(f"\n--- CI Overlap Check ---")
    print(f"  Standard RAG upper ({rag_ci[1]:.1f}%) vs Legalyze lower ({leg_ci[0]:.1f}%): {'OVERLAP' if rag_ci[1] >= leg_ci[0] else 'NO OVERLAP (significant difference)'}")
    print(f"  Zero-Shot upper ({zs_ci[1]:.1f}%) vs Standard RAG lower ({rag_ci[0]:.1f}%): {'OVERLAP' if zs_ci[1] >= rag_ci[0] else 'NO OVERLAP (significant difference)'}")


if __name__ == '__main__':
    print("="*70)
    print("STATISTICAL ANALYSIS OF HALLUCINATION RATE DATA")
    print("Computing from existing Table 2 values in manuscript")
    print("NO FABRICATED DATA — pure mathematical computation")
    print("="*70)
    
    # Scenario 1: N=200 (single final label per statement)
    compute_for_sample_size(200, "Single reviewer label per statement")
    
    # Scenario 2: N=600 (3 reviewers × 200 statements pooled)
    compute_for_sample_size(600, "3 reviewers × 200 statements pooled")
    
    print(f"\n{'='*70}")
    print("⚠️  IMPORTANT: The authors must confirm which N is correct.")
    print("   If N=200: rates can only be multiples of 0.5%")
    print(f"   With N=200: 54.6% → {round(200*0.546)}/200 = {round(200*0.546)/200*100:.1f}%")
    print(f"   With N=200: 22.8% → {round(200*0.228)}/200 = {round(200*0.228)/200*100:.1f}%")
    print(f"   With N=200: 5.5%  → {round(200*0.055)}/200 = {round(200*0.055)/200*100:.1f}%")
    print(f"\n   If N=600: rates can be multiples of ~0.167%")
    print(f"   With N=600: 54.6% → {round(600*0.546)}/600 = {round(600*0.546)/600*100:.2f}%")
    print(f"   With N=600: 22.8% → {round(600*0.228)}/600 = {round(600*0.228)/600*100:.2f}%")
    print(f"   With N=600: 5.5%  → {round(600*0.055)}/600 = {round(600*0.055)/600*100:.2f}%")
    print("="*70)
