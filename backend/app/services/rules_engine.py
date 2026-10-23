from typing import List, Dict, Any, Tuple

class RuleResult:
    def __init__(self, code: str, title: str, points: int, severity: str, description: str):
        self.code = code
        self.title = title
        self.points = points
        self.severity = severity
        self.description = description

    def to_dict(self):
        return {
            "code": self.code,
            "title": self.title,
            "points": self.points,
            "severity": self.severity,
            "description": self.description,
        }

class RulesEngine:
    """
    Explainable, configurable rule engine for financial crime and mule heuristics.
    Separates deterministic heuristics from unsupervised ML anomaly detection.
    """

    @staticmethod
    def evaluate_account(
        pass_through_ratio: float,
        tx_count: int,
        total_credit_inr: float,
        end_balance: float,
        unique_counterparties: int,
        account_age_days: int = 30,
        declared_income_inr: float = 200000.0,
    ) -> Tuple[int, List[RuleResult], List[str]]:
        triggered_rules: List[RuleResult] = []
        signals: List[str] = []
        total_points = 0

        # Rule 1: Rapid Pass-Through Velocity
        if pass_through_ratio >= 0.95:
            r = RuleResult(
                code="RULE_RAPID_PASS_THROUGH",
                title="Severe Pass-Through Layering",
                points=30,
                severity="CRITICAL",
                description=f"Pass-through ratio of {round(pass_through_ratio * 100, 1)}% indicates near-total fund diversion without retention.",
            )
            triggered_rules.append(r)
            total_points += r.points
            signals.append(f"{round(pass_through_ratio * 100, 1)}% fund pass-through velocity with near-zero retained balance")
        elif pass_through_ratio >= 0.85:
            r = RuleResult(
                code="RULE_ELEVATED_PASS_THROUGH",
                title="Elevated Pass-Through Flow",
                points=18,
                severity="HIGH",
                description=f"Pass-through ratio of {round(pass_through_ratio * 100, 1)}% suggests transit node behavior.",
            )
            triggered_rules.append(r)
            total_points += r.points
            signals.append(f"Elevated pass-through ratio of {round(pass_through_ratio * 100, 1)}% to external counterparties")

        # Rule 2: High Value Turnover Disproportionate to Normal Profile
        if total_credit_inr >= 10000000.0:  # > 1 Crore
            r = RuleResult(
                code="RULE_MASSIVE_TURNOVER",
                title="High Value Turnover Tier 1",
                points=25,
                severity="CRITICAL",
                description=f"Turnover of INR {round(total_credit_inr):,} exceeds threshold for unverified individual profile.",
            )
            triggered_rules.append(r)
            total_points += r.points
            signals.append(f"High-value volume of INR {round(total_credit_inr):,} with rapid tranche routing")
        elif total_credit_inr >= 2500000.0:  # > 25 Lakhs
            r = RuleResult(
                code="RULE_HIGH_TURNOVER",
                title="Elevated Credit Volume",
                points=15,
                severity="HIGH",
                description=f"Credit volume of INR {round(total_credit_inr):,} warrants source-of-funds verification.",
            )
            triggered_rules.append(r)
            total_points += r.points
            signals.append(f"Elevated turnover INR {round(total_credit_inr):,} across multiple deposits")

        # Rule 3: High Counterparty Network Dispersion
        if unique_counterparties >= 20:
            r = RuleResult(
                code="RULE_COUNTERPARTY_FANOUT",
                title="High Counterparty Dispersion",
                points=20,
                severity="HIGH",
                description=f"Interaction with {unique_counterparties} unique counterparty nodes indicates dispersal network.",
            )
            triggered_rules.append(r)
            total_points += r.points
            signals.append(f"High counterparty fan-out: {unique_counterparties} unique sending/receiving accounts")
        elif unique_counterparties >= 8:
            r = RuleResult(
                code="RULE_MODERATE_DISPERSION",
                title="Multi-Counterparty Flow",
                points=10,
                severity="MEDIUM",
                description=f"Account interacts with {unique_counterparties} distinct entities.",
            )
            triggered_rules.append(r)
            total_points += r.points

        # Rule 4: Velocity Spikes
        if tx_count >= 50:
            r = RuleResult(
                code="RULE_UNUSUAL_TX_VELOCITY",
                title="Unusual High Frequency Velocity",
                points=15,
                severity="HIGH",
                description=f"Transaction volume of {tx_count} records indicates potential automated routing.",
            )
            triggered_rules.append(r)
            total_points += r.points
            if len(signals) < 3:
                signals.append(f"High frequency velocity ({tx_count} recorded transactions)")

        # Rule 5: New or Dormant Account Burst
        if account_age_days <= 30 and total_credit_inr >= 500000.0:
            r = RuleResult(
                code="RULE_NEW_ACCOUNT_BURST",
                title="New Account High Velocity Burst",
                points=15,
                severity="HIGH",
                description=f"Account age is only {account_age_days} days with sudden high turnover.",
            )
            triggered_rules.append(r)
            total_points += r.points
            if len(signals) < 3:
                signals.append(f"New account ({account_age_days} days active) exhibiting immediate heavy turnover")

        # Fallback signals if fewer than 3
        while len(signals) < 3:
            signals.append("Automated behavioral surveillance baseline evaluation completed")

        capped_rule_score = min(100, total_points)
        return capped_rule_score, triggered_rules, signals[:3]

    @staticmethod
    def calculate_composite_risk(
        rule_score: int,
        ml_anomaly_score: int,
        pass_through_ratio: float,
        total_credit_inr: float,
    ) -> Tuple[int, str]:
        # Balanced composite: 50% rule heuristics + 50% ML IsolationForest
        raw_composite = (rule_score * 0.50) + (ml_anomaly_score * 0.50)

        # Regulatory override: if pass_through >= 0.98 and credit > 50L, floor at 85
        if pass_through_ratio >= 0.98 and total_credit_inr >= 5000000.0:
            raw_composite = max(raw_composite, 88.0)

        final_score = int(round(max(0, min(100, raw_composite))))

        if final_score >= 80:
            tier = "CRITICAL"
        elif final_score >= 65:
            tier = "HIGH"
        elif final_score >= 45:
            tier = "MEDIUM"
        else:
            tier = "LOW"

        return final_score, tier

rules_engine = RulesEngine()
